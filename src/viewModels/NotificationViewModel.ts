// viewModels/NotificationViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/services/notification.service'
import { NotificationEntity } from '@/core/entities/Notification'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const notificationService = new NotificationService()

export function useNotificationsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<NotificationEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de taxa de viagens */
  const {
    data: notificationsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<NotificationEntity[]>>({
    queryKey: ['notifications', limit, offset, searchTerm, filtersKey],
    queryFn: () =>
      notificationService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de taxa de viagens por field */
  const fetchAllNotificationSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await notificationService.getAllByField(
        field,
        value,
        limit,
        offset
      )
    } catch (err) {
      console.error('Erro ao buscar taxa de viagens por campo:', err)
      return null
    }
  }

  /** 🔹 Criar taxa de viagem */
  const createNotification = useMutation({
    mutationFn: (notification: Omit<NotificationEntity, 'id'>) =>
      notificationService.create(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** 🔹 Atualizar taxa de viagem */
  const updateNotification = useMutation({
    mutationFn: ({
      id,
      notification
    }: {
      id: string
      notification: Partial<NotificationEntity>
    }) => notificationService.update(id, notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** 🔹 Deletar taxa de viagem */
  const deleteNotification = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** 🔹 Buscar taxa de viagem único (on-demand) */
  const fetchNotificationById = async (id: string) => {
    try {
      return await notificationService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar taxa de viagem:', err)
      return null
    }
  }

  return {
    notifications: notificationsResponse?.data ?? [],
    pagination: notificationsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllNotificationSByField,

    createNotification,
    updateNotification,
    deleteNotification,
    fetchNotificationById
  }
}
