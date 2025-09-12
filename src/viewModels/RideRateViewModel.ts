// viewModels/RideRateViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RideRateService } from '@/services/rideRate.service'
import { RideRateEntity } from '@/core/entities/RideRate'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const rideRateService = new RideRateService()

export function useRideRatesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<RideRateEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de taxa de viagem */
  const {
    data: rideRatesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<RideRateEntity[]>>({
    queryKey: [
      firebaseCollections.rideRates.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => rideRateService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de taxa de viagem por field */
  const fetchAllRideRateSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await rideRateService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar taxa de viagem por campo:', err)
      return null
    }
  }

  /** 🔹 Criar rideRateistrador */
  const createRideRate = useMutation({
    mutationFn: (rideRate: Omit<RideRateEntity, 'id'>) =>
      rideRateService.create(rideRate),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideRates.root]
      })
    }
  })

  /** 🔹 Atualizar rideRateistrador */
  const updateRideRate = useMutation({
    mutationFn: ({
      id,
      rideRate
    }: {
      id: string
      rideRate: Partial<RideRateEntity>
    }) => rideRateService.update(id, rideRate),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideRates.root]
      })
    }
  })

  /** 🔹 Deletar rideRateistrador */
  const deleteRideRate = useMutation({
    mutationFn: (id: string) => rideRateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideRates.root]
      })
    }
  })

  /** 🔹 Buscar rideRateistrador único (on-demand) */
  const fetchRideRateById = async (id: string) => {
    try {
      return await rideRateService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar rideRateistrador:', err)
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
