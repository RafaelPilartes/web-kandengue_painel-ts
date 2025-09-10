import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DriverService } from '@/services/driver.service'
import { DriverEntity } from '@/core/entities/Driver'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const driverService = new DriverService()

export function useDriversViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de drivers */
  const {
    data: driversResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<DriverEntity[]>>({
    queryKey: ['drivers', limit, offset],
    queryFn: () => driverService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de drivers por field */
  const fetchAllDriverSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await driverService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar drivers por campo:', err)
      return null
    }
  }

  /** 🔹 Criar driver */
  const createDriver = useMutation({
    mutationFn: (driver: Omit<DriverEntity, 'id'>) =>
      driverService.create(driver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    }
  })

  /** 🔹 Atualizar driver */
  const updateDriver = useMutation({
    mutationFn: ({
      id,
      driver
    }: {
      id: string
      driver: Partial<DriverEntity>
    }) => driverService.update(id, driver),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    }
  })

  /** 🔹 Deletar driver */
  const deleteDriver = useMutation({
    mutationFn: (id: string) => driverService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
    }
  })

  /** 🔹 Buscar driver único (on-demand) */
  const fetchDriverById = async (id: string) => {
    try {
      return await driverService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar driver:', err)
      return null
    }
  }

  return {
    drivers: driversResponse?.data ?? [],
    pagination: driversResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllDriverSByField,

    createDriver,
    updateDriver,
    deleteDriver,
    fetchDriverById
  }
}
