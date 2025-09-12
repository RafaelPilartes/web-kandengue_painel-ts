// viewModels/DriverViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DriverService } from '@/services/driver.service'
import { DriverEntity } from '@/core/entities/Driver'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const driverService = new DriverService()

export function useDriversViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<DriverEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de motoristas */
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

  /** 🔹 Buscar lista de motoristas por field */
  const fetchAllDriverSByField = async (
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

  /** 🔹 Criar motorista */
  const createDriver = useMutation({
    mutationFn: (driver: Omit<DriverEntity, 'id'>) =>
      driverService.create(driver),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.drivers.root]
      })
    }
  })

  /** 🔹 Atualizar motorista */
  const updateDriver = useMutation({
    mutationFn: ({
      id,
      driver
    }: {
      id: string
      driver: Partial<DriverEntity>
    }) => driverService.update(id, driver),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.drivers.root]
      })
    }
  })

  /** 🔹 Deletar motorista */
  const deleteDriver = useMutation({
    mutationFn: (id: string) => driverService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.drivers.root]
      })
    }
  })

  /** 🔹 Buscar motorista único (on-demand) */
  const fetchDriverById = async (id: string) => {
    try {
      return await driverService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar motorista:', err)
      return null
    }
  }

  return {
    drivers: driversResponse?.data ?? [],
    pagination: driversResponse?.pagination,
    isLoadingDrivers: loading,
    error,
    refresh: refetch,

    fetchAllDriverSByField,

    createDriver,
    updateDriver,
    deleteDriver,
    fetchDriverById
  }
}
