// viewModels/RideTrackingViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { rideTrackingUseCase } from '@/domain/usecases/rideTrackingUseCase'
import { RideTrackingEntity } from '@/core/entities/RideTracking'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useEffect, useState } from 'react'

export function useRideTrackingsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<RideTrackingEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de trajetorias de viagens */
  const {
    data: rideTrackingsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<RideTrackingEntity[]>>({
    queryKey: [
      firebaseCollections.rideTrackings.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () =>
      rideTrackingUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de trajetorias de viagens por field */
  const fetchAllRideTrackingsByField = async (
    field: FieldPath<RideTrackingEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await rideTrackingUseCase.executeGetAllByField(
        field,
        value,
        limit,
        offset
      )
    } catch (err) {
      console.error('Erro ao buscar trajetorias de viagens por campo:', err)
      return null
    }
  }

  /** Criar trajetoria de viagem */
  const createRideTracking = useMutation({
    mutationFn: (rideTracking: Omit<RideTrackingEntity, 'id'>) =>
      rideTrackingUseCase.executeCreate(rideTracking),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideTrackings.root]
      })
    }
  })

  /** Atualizar trajetoria de viagem */
  const updateRideTracking = useMutation({
    mutationFn: ({
      id,
      rideTracking
    }: {
      id: string
      rideTracking: Partial<RideTrackingEntity>
    }) => rideTrackingUseCase.executeUpdate(id, rideTracking),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideTrackings.root]
      })
    }
  })

  /** Deletar trajetoria de viagem */
  const deleteRideTracking = useMutation({
    mutationFn: (id: string) => rideTrackingUseCase.executeDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.rideTrackings.root]
      })
    }
  })

  /** Buscar trajetoria de viagem único (on-demand) */
  const fetchRideTrackingById = async (id: string) => {
    try {
      return await rideTrackingUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar trajetoria de viagem:', err)
      return null
    }
  }

  /** Buscar rideTracking por field */
  const fetchOneRideTrackingByField = async (
    field: FieldPath<RideTrackingEntity>,
    value: string
  ) => {
    try {
      return await rideTrackingUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar trajetoria de viagem por campo:', err)
      return null
    }
  }

  return {
    rideTrackings: rideTrackingsResponse?.data ?? [],
    pagination: rideTrackingsResponse?.pagination,
    isLoadingRidesTracking: loading,
    error,
    refresh: refetch,

    fetchAllRideTrackingsByField,
    fetchOneRideTrackingByField,

    createRideTracking,
    updateRideTracking,
    deleteRideTracking,
    fetchRideTrackingById
  }
}

export function useRideTrackingRealtime(rideId?: string) {
  const [tracking, setTracking] = useState<RideTrackingEntity | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!rideId) {
      setTracking(null)
      return
    }

    setIsLoading(true)
    const unsubscribe = rideTrackingUseCase.listenByRideId(
      rideId,
      data => {
        setTracking(data)
        setIsLoading(false)
      },
      err => {
        console.error(`Erro no listener de tracking da corrida ${rideId}:`, err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [rideId])

  return { tracking, isLoading }
}
