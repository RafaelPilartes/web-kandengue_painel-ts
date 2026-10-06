// viewModels/RideRateViewModel.ts
import { useQuery } from '@tanstack/react-query'
import { rideRateUseCase } from '@/domain/usecases/rideRateUseCase'
import { RideRateEntity } from '@/core/entities/RideRate'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

/**
 * **Só leitura.** `rideRates` é legado e passou a `allow write: if false`.
 *
 * Quem fixa preços desde o motor de preços é `pricingProfiles`, em
 * Preços → Perfis, escrito pela API. As abas Tarifas e Repartição saíram das
 * Configurações, e com elas o `createRideRate`/`updateRideRate`/
 * `deleteRideRate` que aqui estavam — escritas que hoje davam
 * `permission-denied`.
 *
 * Os documentos ficam onde estão: são o histórico de como se cobrava antes.
 */
export function useRideRatesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<RideRateEntity>
) {
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
    queryFn: () => rideRateUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de taxa de viagem por field */
  const fetchAllRideRatesByField = async (
    field: FieldPath<RideRateEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await rideRateUseCase.executeGetAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar taxa de viagem por campo:', err)
      return null
    }
  }

  /** Buscar ride único (on-demand) */
  const fetchRideRateById = async (id: string) => {
    try {
      return await rideRateUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar corrida:', err)
      return null
    }
  }

  /** Buscar rideRate por field */
  const fetchOneRideRateByField = async (
    field: FieldPath<RideRateEntity>,
    value: string
  ) => {
    try {
      return await rideRateUseCase.executeGetOneByField(field, value)
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
    fetchRideRateById
  }
}
