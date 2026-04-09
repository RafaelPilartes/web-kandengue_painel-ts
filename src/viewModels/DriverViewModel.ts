// viewModels/DriverViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DriverService } from '@/services/driver.service'
import { DriverEntity } from '@/core/entities/Driver'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo, useEffect, useState } from 'react'
import { getUserStatusLabel } from '@/utils/gettersLabels'
import { withAudit } from '@/services/audit.service'

const driverService = new DriverService()

export function useDriversViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<DriverEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de motoristas */
  const {
    data: driversResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<DriverEntity[]>>({
    queryKey: [
      firebaseCollections.drivers.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => driverService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  // transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!driversResponse?.data) return []
    return driversResponse?.data.map(doc => ({
      Id: doc.id,
      Nome: doc.name,
      Email: doc.email,
      Telefone: doc.phone,
      Status: getUserStatusLabel(doc.status),
      'Data de criação': doc.created_at,
      'Última atualização': doc.updated_at
    }))
  }, [driversResponse?.data])

  /** Buscar lista de motoristas por field */
  const fetchAllDriversByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await driverService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar motoristas por campo:', err)
      return null
    }
  }

  /** Criar motorista */
  const createDriver = useMutation({
    mutationFn: (driver: Omit<DriverEntity, 'id'>) =>
      withAudit(() => driverService.create(driver), {
        action: 'create',
        module: 'drivers',
        description: `Criou motorista: ${driver.name} (${driver.phone})`,
        target_type: 'driver',
        target_label: driver.name,
        new_data: driver
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.drivers.root]
      })
    }
  })

  /** Atualizar motorista */
  const updateDriver = useMutation({
    mutationFn: async ({
      id,
      driver
    }: {
      id: string
      driver: Partial<DriverEntity>
    }) => {
      const previous_data = await driverService.getById(id).catch(() => null)
      return withAudit(() => driverService.update(id, driver), {
        action: 'update',
        module: 'drivers',
        description: `Atualizou os dados do motorista - ID: ${id}`,
        target_id: id,
        target_type: 'driver',
        previous_data: previous_data || undefined,
        new_data: driver
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.drivers.root]
      })
    }
  })

  /** Deletar motorista */
  const deleteDriver = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await driverService.getById(id).catch(() => null)
      return withAudit(() => driverService.delete(id), {
        action: 'delete',
        module: 'drivers',
        description: `Excluiu o motorista - ID: ${id}`,
        target_id: id,
        target_type: 'driver',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.drivers.root]
      })
    }
  })

  /** Soft delete motorista (Firestore: status=deleted + Auth: removeUser) */
  const softDeleteDriver = useMutation({
    mutationFn: async ({
      id,
      firebaseUid
    }: {
      id: string
      firebaseUid?: string
    }) => {
      const previous_data = await driverService.getById(id).catch(() => null)
      return withAudit(() => driverService.softDelete(id, firebaseUid), {
        action: 'delete',
        module: 'drivers',
        description: `Soft-deletou motorista - ID: ${id}`,
        target_id: id,
        target_type: 'driver',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.drivers.root]
      })
    }
  })

  /** Buscar motorista único (on-demand) */
  const fetchDriverById = async (id: string) => {
    try {
      return await driverService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar motorista:', err)
      return null
    }
  }

  /** Buscar driver por field */
  const fetchOneDriverByField = async (
    field: keyof DriverEntity,
    value: string
  ) => {
    try {
      return await driverService.getOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar motorista por campo:', err)
      return null
    }
  }

  return {
    drivers: driversResponse?.data ?? [],
    pagination: driversResponse?.pagination,
    isLoadingDrivers: loading,
    error,
    refresh: refetch,

    fetchAllDriversByField,
    fetchOneDriverByField,

    createDriver,
    updateDriver,
    deleteDriver,
    softDeleteDriver,
    fetchDriverById,

    dataToExport
  }
}

export function useDriversOnlineRealtime() {
  const [drivers, setDrivers] = useState<DriverEntity[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const unsubscribe = driverService.listenOnlineDrivers(
      data => {
        setDrivers(data)
        setIsLoading(false)
      },
      err => {
        console.error('Erro no listener de motoristas online:', err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { drivers, isLoading }
}
