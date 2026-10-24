// viewModels/RideViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rideUseCase } from '@/domain/usecases/rideUseCase'
import { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useEffect, useMemo, useRef } from 'react'
import { getRideStatusLabel, getRideTypeLabel } from '@/utils/gettersLabels'
import type { BreakdownType, RideFareInterface } from '@/interfaces/IRideFare'
import type { PayoutsType } from '@/types/ride'
import { withAudit } from '@/observability/audit'

export function useRidesViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<RideEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de corridas */
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
    queryFn: () => rideUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 2000 // cache 1min
    // staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de corridas por field */
  const fetchAllRidesByField = async (
    field: FieldPath<RideEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await rideUseCase.executeGetAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar corridas por campo:', err)
      return null
    }
  }

  /** Criar corrida */
  const createRide = useMutation({
    mutationFn: (ride: Omit<RideEntity, 'id'>) =>
      withAudit(() => rideUseCase.executeCreate(ride), {
        action: 'create',
        module: 'rides',
        description: `Criou nova corrida: ${ride.pickup?.description ?? 'N/A'} para ${ride.dropoff?.description ?? 'N/A'}`,
        target_type: 'ride',
        new_data: ride
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rides.root]
      })
    }
  })

  /** Atualizar corrida */
  const updateRide = useMutation({
    mutationFn: async ({
      id,
      ride
    }: {
      id: string
      ride: Partial<RideEntity>
    }) => {
      const previous_data = await rideUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => rideUseCase.executeUpdate(id, ride), {
        action: 'update',
        module: 'rides',
        description: `Atualizou os dados da corrida - ID: ${id}`,
        target_id: id,
        target_type: 'ride',
        previous_data: previous_data || undefined,
        new_data: ride
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rides.root]
      })
    }
  })

  /** Deletar corrida */
  const deleteRide = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await rideUseCase.executeGetById(id).catch(() => null)
      return withAudit(() => rideUseCase.executeDelete(id), {
        action: 'delete',
        module: 'rides',
        description: `Excluiu corrida - ID: ${id}`,
        target_id: id,
        target_type: 'ride',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rides.root]
      })
    }
  })

  /** Buscar corrida único (on-demand) */
  const fetchRideById = async (id: string) => {
    try {
      return await rideUseCase.executeGetById(id)
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

  // Calculate Passenger Expenses
  function calculatePassengerExpenses(rides: RideEntity[]): number {
    return rides
      .filter(ride => ride.status === 'completed') // só corridas concluídas
      .reduce((total, ride) => {
        return total + (ride.fare?.total || 0)
      }, 0)
  }

  // Calculate Driver Earnings
  function calculateDriverEarnings(rides: RideEntity[]): number {
    return rides
      .filter(ride => ride.status === 'completed') // só corridas concluídas
      .reduce((total, ride) => {
        return total + (ride.fare?.payouts?.driver_earnings || 0)
      }, 0)
  }

  // transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!ridesResponse?.data) return []
    return ridesResponse?.data.map(doc => ({
      Id: doc.id,
      'Nome do Passageiro': doc.user.name,
      /*
       * ⚠️ **O telefone do passageiro saiu da exportação a 2026-10-24.** A API
       * deixou de escrever `user.phone` na corrida; o número vive em
       * `rides/{id}/private/contacts`, um documento por corrida. Numa
       * exportação de centenas de corridas isso eram centenas de leituras — e
       * uma coluna vazia é pior do que coluna nenhuma. Quem precisa de um
       * número abre o detalhe da corrida, que já o carrega.
       */
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

  const metrics = useMemo(() => {
    const totalRides = ridesResponse?.data.length ?? 0
    let completed = 0
    let canceled = 0
    let totalRevenue = 0
    let totalDistance = 0
    let sumBaseFare = 0
    let sumDistanceCost = 0
    let sumWaitCost = 0
    let sumInsurance = 0
    let sumDiscount = 0
    let sumDriverEarnings = 0
    let sumCompanyEarnings = 0
    let sumPensionFund = 0

    if (ridesResponse?.data) {
      for (const rideFor of ridesResponse?.data) {
        const fare = rideFor.fare ?? ({} as RideFareInterface)
        const breakdown = fare.breakdown ?? ({} as BreakdownType)
        const payouts = fare.payouts ?? ({} as PayoutsType)

        // totals
        const totalFor = Number(fare.total ?? 0)
        totalRevenue += totalFor

        totalDistance += Number(rideFor.distance ?? 0)

        sumBaseFare += Number(breakdown.base_fare ?? 0)
        sumDistanceCost += Number(breakdown.distance_cost ?? 0)
        sumWaitCost += Number(breakdown.wait_cost ?? 0)
        sumInsurance += Number(breakdown.insurance_fee ?? 0)
        sumDiscount += Number(breakdown.discount ?? 0)

        sumDriverEarnings += Number(payouts.driver_earnings ?? 0)
        sumCompanyEarnings += Number(payouts.company_earnings ?? 0)
        sumPensionFund += Number(payouts.pension_fund ?? 0)

        if (rideFor.status === 'completed') completed++
        if (rideFor.status === 'canceled') canceled++
      }
    }

    const avgTicket = totalRides === 0 ? 0 : totalRevenue / totalRides
    const avgDistance = totalRides === 0 ? 0 : totalDistance / totalRides

    return {
      totalRides,
      completed,
      canceled,
      totalRevenue,
      avgTicket,
      avgDistance,
      breakdownTotals: {
        base: sumBaseFare,
        distance: sumDistanceCost,
        wait: sumWaitCost,
        insurance: sumInsurance,
        discount: sumDiscount
      },
      payoutsTotals: {
        driver: sumDriverEarnings,
        company: sumCompanyEarnings,
        pension: sumPensionFund
      }
    }
  }, [ridesResponse])

  /** Buscar ride por field */
  const fetchOneRideByField = async (
    field: FieldPath<RideEntity>,
    value: string
  ) => {
    try {
      return await rideUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar corrida por campo:', err)
      return null
    }
  }

  /** 🔹 Escutar corrida específico em tempo real */
  const rideListenerRef = useRef<null | (() => void)>(null)
  const listenRideRealtime = (
    id: string,
    onUpdate: (d: RideEntity) => void
  ) => {
    if (rideListenerRef.current) {
      rideListenerRef.current() // remove anterior
    }
    const unsubscribe = rideUseCase.executeListenRideRealtime(id, onUpdate, err =>
      console.error('Erro listener corrida:', err)
    )
    rideListenerRef.current = unsubscribe
  }

  /** 🔹 Escutar corrida pelo campo em tempo real */
  const fieldListenerRef = useRef<null | (() => void)>(null)
  const listenByField = (
    field: FieldPath<RideEntity>,
    value: string,
    onUpdate: (d: RideEntity) => void
  ) => {
    if (fieldListenerRef.current) {
      fieldListenerRef.current() // remove anterior
    }
    const unsubscribe = rideUseCase.executeListenByField(field, value, onUpdate, err =>
      console.error('Erro listener corrida:', err)
    )
    fieldListenerRef.current = unsubscribe
  }

  // 🔹 Escutar corridas em tempo real
  const allListenerRef = useRef<null | (() => void)>(null)
  const listenAllByField = (
    field: FieldPath<RideEntity>,
    value: any,
    onUpdate: (rides: RideEntity[]) => void,
    options?: {
      limit?: number
      orderBy?: keyof RideEntity
      orderDirection?: 'asc' | 'desc'
    }
  ) => {
    if (allListenerRef.current) {
      allListenerRef.current() // remove anterior
    }
    const unsubscribe = rideUseCase.executeListenAllByField(
      field,
      value,
      onUpdate,
      err => console.error('Erro listener motorista:', err),
      options
    )
    allListenerRef.current = unsubscribe
  }

  // 🔹 Escutar corridas em tempo real
  const listenAll = (
    onUpdate: (rides: RideEntity[]) => void,
    options?: {
      filters?: Partial<RideEntity>
      limit?: number
      orderBy?: keyof RideEntity
      orderDirection?: 'asc' | 'desc'
    }
  ) => {
    if (allListenerRef.current) {
      allListenerRef.current() // remove anterior
    }
    const unsubscribe = rideUseCase.executeListenAll(
      onUpdate,
      err => console.error('Erro listener motorista:', err),
      options
    )
    allListenerRef.current = unsubscribe
  }

  useEffect(() => {
    return () => {
      if (rideListenerRef.current) rideListenerRef.current()
      if (fieldListenerRef.current) fieldListenerRef.current()
      if (allListenerRef.current) allListenerRef.current()
    }
  }, [])

  /**
   * Marca a tarifa como revista, pela API. **Não altera a tarifa.** Sem
   * `withAudit`: a API escreve em `auditLogs` dentro da própria transacção.
   */
  const markFareReviewed = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      rideUseCase.executeMarkFareReviewed(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rides.root]
      })
    }
  })

  return {
    markFareReviewed,
    rides: ridesResponse?.data ?? [],
    pagination: ridesResponse?.pagination,
    isLoadingRides: loading,
    error,
    refresh: refetch,

    ridesMetrics: metrics,

    fetchAllRidesByField,
    fetchOneRideByField,

    createRide,
    updateRide,
    deleteRide,
    fetchRideById,
    calculateCompanyProfit,
    calculateDriverEarnings,
    calculatePassengerExpenses,

    dataToExport,

    // REALTIME
    listenRideRealtime,
    listenByField,
    listenAllByField,
    listenAll
  }
}
