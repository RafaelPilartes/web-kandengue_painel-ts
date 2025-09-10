import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RideService } from '@/services/ride.service'
import { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const rideService = new RideService()

export function useRidesViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de rides */
  const {
    data: ridesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<RideEntity[]>>({
    queryKey: ['rides', limit, offset],
    queryFn: () => rideService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de rides por field */
  const fetchAllRideSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await rideService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar rides por campo:', err)
      return null
    }
  }

  /** 🔹 Criar ride */
  const createRide = useMutation({
    mutationFn: (ride: Omit<RideEntity, 'id'>) => rideService.create(ride),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] })
    }
  })

  /** 🔹 Atualizar ride */
  const updateRide = useMutation({
    mutationFn: ({ id, ride }: { id: string; ride: Partial<RideEntity> }) =>
      rideService.update(id, ride),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] })
    }
  })

  /** 🔹 Deletar ride */
  const deleteRide = useMutation({
    mutationFn: (id: string) => rideService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rides'] })
    }
  })

  /** 🔹 Buscar ride único (on-demand) */
  const fetchRideById = async (id: string) => {
    try {
      return await rideService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar ride:', err)
      return null
    }
  }

  return {
    rides: ridesResponse?.data ?? [],
    pagination: ridesResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllRideSByField,

    createRide,
    updateRide,
    deleteRide,
    fetchRideById
  }
}
