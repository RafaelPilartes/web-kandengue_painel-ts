import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RideTrackingService } from '@/services/rideTracking.service'
import { RideTrackingEntity } from '@/core/entities/RideTracking'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const rideTrackingService = new RideTrackingService()

export function useRideTrackingsViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de rideTrackings */
  const {
    data: rideTrackingsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<RideTrackingEntity[]>>({
    queryKey: ['rideTrackings', limit, offset],
    queryFn: () => rideTrackingService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de rideTrackings por field */
  const fetchAllRideTrackingSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await rideTrackingService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar rideTrackings por campo:', err)
      return null
    }
  }

  /** 🔹 Criar rideTracking */
  const createRideTracking = useMutation({
    mutationFn: (rideTracking: Omit<RideTrackingEntity, 'id'>) =>
      rideTrackingService.create(rideTracking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rideTrackings'] })
    }
  })

  /** 🔹 Atualizar rideTracking */
  const updateRideTracking = useMutation({
    mutationFn: ({
      id,
      rideTracking
    }: {
      id: string
      rideTracking: Partial<RideTrackingEntity>
    }) => rideTrackingService.update(id, rideTracking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rideTrackings'] })
    }
  })

  /** 🔹 Deletar rideTracking */
  const deleteRideTracking = useMutation({
    mutationFn: (id: string) => rideTrackingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rideTrackings'] })
    }
  })

  /** 🔹 Buscar rideTracking único (on-demand) */
  const fetchRideTrackingById = async (id: string) => {
    try {
      return await rideTrackingService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar rideTracking:', err)
      return null
    }
  }

  return {
    rideTrackings: rideTrackingsResponse?.data ?? [],
    pagination: rideTrackingsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllRideTrackingSByField,

    createRideTracking,
    updateRideTracking,
    deleteRideTracking,
    fetchRideTrackingById
  }
}
