// viewModels/RideViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RideService } from '@/services/ride.service'
import { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo } from 'react'
import { getRideStatusLabel, getRideTypeLabel } from '@/utils/gettersLabels'

const rideService = new RideService()

export function useRidesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<RideEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de corridas */
  const {
    data: ridesResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<RideEntity[]>>({
    queryKey: [
      firebaseCollections.rides.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => rideService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de corridas por field */
  const fetchAllRidesByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await rideService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar corridas por campo:', err)
      return null
    }
  }

  /** 🔹 Criar corrida */
  const createRide = useMutation({
    mutationFn: (ride: Omit<RideEntity, 'id'>) => rideService.create(ride),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rides.root]
      })
    }
  })

  /** 🔹 Atualizar corrida */
  const updateRide = useMutation({
    mutationFn: ({ id, ride }: { id: string; ride: Partial<RideEntity> }) =>
      rideService.update(id, ride),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rides.root]
      })
    }
  })

  /** 🔹 Deletar corrida */
  const deleteRide = useMutation({
    mutationFn: (id: string) => rideService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rides.root]
      })
    }
  })

  /** 🔹 Buscar corrida único (on-demand) */
  const fetchRideById = async (id: string) => {
    try {
      return await rideService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar corrida:', err)
      return null
    }
  }

  // Calculate total of Company
  function calculateCompanyProfit(rides: RideEntity[]): number {
    return rides
      .filter(ride => ride.status === 'completed') // só corridas concluídas
      .reduce((total, ride) => {
        return total + (ride.fare?.payouts?.company_earnings || 0)
      }, 0)
  }

  // 🔹 transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!ridesResponse?.data) return []
    return ridesResponse?.data.map(doc => ({
      Id: doc.id,
      'Nome do Passageiro': doc.user.name,
      'Telefone do Passageiro': doc.user.phone,
      'Nome do Motorista': doc.driver?.name,
      'Telefone do Motorista': doc.driver?.phone,
      Status: getRideStatusLabel(doc.status),
      Recolha: doc.pickup.description,
      Destino: doc.dropoff.description,
      'Tipo de corrida': getRideTypeLabel(doc.type),
      'Ganhos do motorista': doc.fare?.payouts?.driver_earnings,
      'Ganhos da empresa': doc.fare?.payouts?.company_earnings,
      'Fundo de emergencia': doc.fare?.payouts?.pension_fund,
      'Total da corrida': doc.fare?.total,
      'Data de criação': doc.created_at,
      'Última atualização': doc.updated_at
    }))
  }, [ridesResponse?.data])

  return {
    rides: ridesResponse?.data ?? [],
    pagination: ridesResponse?.pagination,
    isLoadingRides: loading,
    error,
    refresh: refetch,

    fetchAllRidesByField,

    createRide,
    updateRide,
    deleteRide,
    fetchRideById,
    calculateCompanyProfit,

    dataToExport
  }
}
