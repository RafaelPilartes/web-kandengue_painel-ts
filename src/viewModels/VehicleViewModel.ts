// viewModels/VehicleViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vehicleUseCase } from '@/domain/usecases/vehicleUseCase'
import type { VehicleEntity } from '@/core/entities/Vehicle'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { withAudit } from '@/observability/audit'

type NewVehicle = Omit<VehicleEntity, 'id' | 'created_at' | 'updated_at'>

/** Default herdado do DAO antigo (o motor usa 50). Ver plano, Task 9. */
const LEGACY_PAGE_SIZE = 500

/** Query-key factory — invalidações precisas em vez de arrasar a raiz. */
export const VEHICLE_KEYS = {
  all: ['vehicles'] as const,
  lists: () => [...VEHICLE_KEYS.all, 'list'] as const,
  list: (options: unknown) => [...VEHICLE_KEYS.lists(), { options }] as const,
  details: () => [...VEHICLE_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...VEHICLE_KEYS.details(), id] as const
}

export function useVehiclesViewModel(
  limit?: number,
  searchTerm?: string,
  filters?: Partial<VehicleEntity>
) {
  const queryClient = useQueryClient()

  // O DAO antigo devolvia 500 por omissão e o motor devolve 50. Manter o
  // valor observável enquanto o tamanho de página não for decidido de propósito.
  const options: QueryOptions<VehicleEntity> = {
    limit: limit ?? LEGACY_PAGE_SIZE,
    searchTerm,
    filters
  }

  const {
    data: vehiclesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<VehicleEntity[]>>({
    queryKey: VEHICLE_KEYS.list(options),
    queryFn: () => vehicleUseCase.executeGetAll(options),
    staleTime: 1000 * 60
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: VEHICLE_KEYS.all })

  const fetchAllVehiclesByField = async (
    field: string,
    value: any,
    limitValue?: number
  ) => {
    try {
      return await vehicleUseCase.executeGetAllByField(
        field as keyof VehicleEntity,
        value,
        { limit: limitValue ?? LEGACY_PAGE_SIZE }
      )
    } catch (err) {
      console.error('Erro ao buscar veículos por campo:', err)
      return null
    }
  }

  const createVehicle = useMutation({
    mutationFn: (vehicle: NewVehicle) =>
      withAudit(() => vehicleUseCase.executeCreate(vehicle), {
        action: 'create',
        module: 'vehicles',
        description: `Criou novo veículo: ${vehicle.plate}`,
        target_type: 'vehicle',
        target_label: vehicle.plate,
        new_data: vehicle
      }),
    onSuccess: invalidate
  })

  const updateVehicle = useMutation({
    mutationFn: async ({
      id,
      vehicle
    }: {
      id: string
      vehicle: Partial<VehicleEntity>
    }) => {
      const previous_data = await vehicleUseCase
        .executeGetById(id)
        .catch(() => null)

      return withAudit(() => vehicleUseCase.executeUpdate(id, vehicle), {
        action: 'update',
        module: 'vehicles',
        description: `Atualizou veículo - ID: ${id}`,
        target_id: id,
        target_type: 'vehicle',
        previous_data: previous_data || undefined,
        new_data: vehicle
      })
    },
    onSuccess: invalidate
  })

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await vehicleUseCase
        .executeGetById(id)
        .catch(() => null)

      return withAudit(() => vehicleUseCase.executeDelete(id), {
        action: 'delete',
        module: 'vehicles',
        description: `Excluiu veículo - ID: ${id}`,
        target_id: id,
        target_type: 'vehicle',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: invalidate
  })

  const fetchVehicleById = async (id: string) => {
    try {
      return await vehicleUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar veículo:', err)
      return null
    }
  }

  const fetchOneVehicleByField = async (
    field: keyof VehicleEntity,
    value: string
  ) => {
    try {
      return await vehicleUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar veículo por campo:', err)
      return null
    }
  }

  /**
   * Valida ou recusa no servidor. Sem `withAudit`: a API escreve em
   * `auditLogs` dentro da própria transacção, e esse registo não pode
   * existir sem a mudança de estado.
   */
  const reviewVehicle = useMutation({
    mutationFn: ({
      id,
      decision,
      reason
    }: {
      id: string
      decision: 'validated' | 'rejected'
      reason?: string
    }) => vehicleUseCase.executeReviewVehicle(id, decision, reason),
    onSuccess: invalidate
  })

  return {
    vehicles: vehiclesResponse?.data ?? [],
    pagination: vehiclesResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllVehiclesByField,
    fetchOneVehicleByField,

    createVehicle,
    updateVehicle,
    deleteVehicle,
    reviewVehicle,
    fetchVehicleById
  }
}
