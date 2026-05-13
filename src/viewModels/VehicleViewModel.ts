// viewModels/VehicleViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VehicleService } from '@/routes/services/vehicle.service'
import { VehicleEntity } from '@/core/entities/Vehicle'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { withAudit } from '@/routes/services/audit.service'

const vehicleService = new VehicleService()

export function useVehiclesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<VehicleEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de veículos */
  const {
    data: vehiclesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<VehicleEntity[]>>({
    queryKey: [
      firebaseCollections.vehicles.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => vehicleService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de veículos por field */
  const fetchAllVehiclesByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await vehicleService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar veículos por campo:', err)
      return null
    }
  }

  /** Criar veículo */
  const createVehicle = useMutation({
    mutationFn: (vehicle: Omit<VehicleEntity, 'id'>) =>
      withAudit(() => vehicleService.create(vehicle), {
        action: 'create',
        module: 'vehicles',
        description: `Criou novo veículo: ${vehicle.plate}`,
        target_type: 'vehicle',
        target_label: vehicle.plate,
        new_data: vehicle
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.vehicles.root]
      })
    }
  })

  /** Atualizar veículo */
  const updateVehicle = useMutation({
    mutationFn: async ({
      id,
      vehicle
    }: {
      id: string
      vehicle: Partial<VehicleEntity>
    }) => {
      const previous_data = await vehicleService.getById(id).catch(() => null)
      return withAudit(() => vehicleService.update(id, vehicle), {
        action: 'update',
        module: 'vehicles',
        description: `Atualizou veículo - ID: ${id}`,
        target_id: id,
        target_type: 'vehicle',
        previous_data: previous_data || undefined,
        new_data: vehicle
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.vehicles.root]
      })
    }
  })

  /** Deletar veículo */
  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await vehicleService.getById(id).catch(() => null)
      return withAudit(() => vehicleService.delete(id), {
        action: 'delete',
        module: 'vehicles',
        description: `Excluiu veículo - ID: ${id}`,
        target_id: id,
        target_type: 'vehicle',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.vehicles.root]
      })
    }
  })

  /** Buscar veículo único (on-demand) */
  const fetchVehicleById = async (id: string) => {
    try {
      return await vehicleService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar veículo:', err)
      return null
    }
  }

  /** Buscar vehicle por field */
  const fetchOneVehicleByField = async (
    field: keyof VehicleEntity,
    value: string
  ) => {
    try {
      return await vehicleService.getOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar veículo por campo:', err)
      return null
    }
  }

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
    fetchVehicleById
  }
}
