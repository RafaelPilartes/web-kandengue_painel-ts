import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RideRateService } from '@/services/rideRate.service'
import { RideRateEntity } from '@/core/entities/RideRate'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const rideRateService = new RideRateService()

export function useRideRatesViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de rideRates */
  const {
    data: rideRatesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<RideRateEntity[]>>({
    queryKey: ['rideRates', limit, offset],
    queryFn: () => rideRateService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de rideRates por field */
  const fetchAllRideRateSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await rideRateService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar rideRates por campo:', err)
      return null
    }
  }

  /** 🔹 Criar rideRate */
  const createRideRate = useMutation({
    mutationFn: (rideRate: Omit<RideRateEntity, 'id'>) =>
      rideRateService.create(rideRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rideRates'] })
    }
  })

  /** 🔹 Atualizar rideRate */
  const updateRideRate = useMutation({
    mutationFn: ({
      id,
      rideRate
    }: {
      id: string
      rideRate: Partial<RideRateEntity>
    }) => rideRateService.update(id, rideRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rideRates'] })
    }
  })

  /** 🔹 Deletar rideRate */
  const deleteRideRate = useMutation({
    mutationFn: (id: string) => rideRateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rideRates'] })
    }
  })

  /** 🔹 Buscar rideRate único (on-demand) */
  const fetchRideRateById = async (id: string) => {
    try {
      return await rideRateService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar rideRate:', err)
      return null
    }
  }

  return {
    rideRates: rideRatesResponse?.data ?? [],
    pagination: rideRatesResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllRideRateSByField,

    createRideRate,
    updateRideRate,
    deleteRideRate,
    fetchRideRateById
  }
}
