import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VehicleService } from '@/services/vehicle.service'
import { VehicleEntity } from '@/core/entities/Vehicle'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const vehicleService = new VehicleService()

export function useVehiclesViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de vehicles */
  const {
    data: vehiclesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<VehicleEntity[]>>({
    queryKey: ['vehicles', limit, offset],
    queryFn: () => vehicleService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de vehicles por field */
  const fetchAllVehicleSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await vehicleService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar vehicles por campo:', err)
      return null
    }
  }

  /** 🔹 Criar vehicle */
  const createVehicle = useMutation({
    mutationFn: (vehicle: Omit<VehicleEntity, 'id'>) =>
      vehicleService.create(vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    }
  })

  /** 🔹 Atualizar vehicle */
  const updateVehicle = useMutation({
    mutationFn: ({
      id,
      vehicle
    }: {
      id: string
      vehicle: Partial<VehicleEntity>
    }) => vehicleService.update(id, vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    }
  })

  /** 🔹 Deletar vehicle */
  const deleteVehicle = useMutation({
    mutationFn: (id: string) => vehicleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    }
  })

  /** 🔹 Buscar vehicle único (on-demand) */
  const fetchVehicleById = async (id: string) => {
    try {
      return await vehicleService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar vehicle:', err)
      return null
    }
  }

  return {
    vehicles: vehiclesResponse?.data ?? [],
    pagination: vehiclesResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllVehicleSByField,

    createVehicle,
    updateVehicle,
    deleteVehicle,
    fetchVehicleById
  }
}
