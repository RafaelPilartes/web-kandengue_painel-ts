// viewModels/RideRateViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RideRateService } from '@/services/rideRate.service'
import { RideRateEntity } from '@/core/entities/RideRate'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { withAudit } from '@/services/audit.service'

const rideRateService = new RideRateService()

export function useRideRatesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<RideRateEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de taxa de viagem */
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

  /** Buscar lista de taxa de viagem por field */
  const fetchAllRideRatesByField = async (
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

  /** Criar ride */
  const createRideRate = useMutation({
    mutationFn: (rideRate: Omit<RideRateEntity, 'id'>) =>
      withAudit(() => rideRateService.create(rideRate), {
        action: 'create',
        module: 'system',
        description: `Criou nova taxa de viagem`,
        target_type: 'ride_rate',
        new_data: rideRate
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideRates.root]
      })
    }
  })

  /** Atualizar ride */
  const updateRideRate = useMutation({
    mutationFn: async ({
      id,
      rideRate
    }: {
      id: string
      rideRate: Partial<RideRateEntity>
    }) => {
      const previous_data = await rideRateService.getById(id).catch(() => null)
      return withAudit(() => rideRateService.update(id, rideRate), {
        action: 'update',
        module: 'system',
        description: `Atualizou taxa de viagem - ID: ${id}`,
        target_id: id,
        target_type: 'ride_rate',
        previous_data: previous_data || undefined,
        new_data: rideRate
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideRates.root]
      })
    }
  })

  /** Deletar ride */
  const deleteRideRate = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await rideRateService.getById(id).catch(() => null)
      return withAudit(() => rideRateService.delete(id), {
        action: 'delete',
        module: 'system',
        description: `Excluiu taxa de viagem - ID: ${id}`,
        target_id: id,
        target_type: 'ride_rate',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideRates.root]
      })
    }
  })

  /** Buscar ride único (on-demand) */
  const fetchRideRateById = async (id: string) => {
    try {
      return await rideRateService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar corrida:', err)
      return null
    }
  }

  /** Buscar rideRate por field */
  const fetchOneRideRateByField = async (
    field: keyof RideRateEntity,
    value: string
  ) => {
    try {
      return await rideRateService.getOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar corrida por campo:', err)
      return null
    }
  }

  return {
    rideRates: rideRatesResponse?.data ?? [],
    pagination: rideRatesResponse?.pagination,
    isLoadingRideRates: loading,
    error,
    refresh: refetch,

    fetchAllRideRatesByField,
    fetchOneRideRateByField,

    createRideRate,
    updateRideRate,
    deleteRideRate,
    fetchRideRateById
  }
}
