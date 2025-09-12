// viewModels/VehicleViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { VehicleService } from '@/services/vehicle.service'
import { VehicleEntity } from '@/core/entities/Vehicle'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const vehicleService = new VehicleService()

export function useVehiclesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<VehicleEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de veículos */
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

  /** 🔹 Buscar lista de veículos por field */
  const fetchAllVehicleSByField = async (
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

  /** 🔹 Criar veículo */
  const createVehicle = useMutation({
    mutationFn: (vehicle: Omit<VehicleEntity, 'id'>) =>
      vehicleService.create(vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.vehicles.root]
      })
    }
  })

  /** 🔹 Atualizar veículo */
  const updateVehicle = useMutation({
    mutationFn: ({
      id,
      vehicle
    }: {
      id: string
      vehicle: Partial<VehicleEntity>
    }) => vehicleService.update(id, vehicle),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.vehicles.root]
      })
    }
  })

  /** 🔹 Deletar veículo */
  const deleteVehicle = useMutation({
    mutationFn: (id: string) => vehicleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.vehicles.root]
      })
    }
  })

  /** 🔹 Buscar veículo único (on-demand) */
  const fetchVehicleById = async (id: string) => {
    try {
      return await vehicleService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar veículo:', err)
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
