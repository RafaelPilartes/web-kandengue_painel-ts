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

  /** 🔹 Buscar lista de notificação */
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

  /** 🔹 Buscar lista de notificações por field */
  const fetchAllNotificationsByField = async (
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
      console.error('Erro ao buscar notificações por campo:', err)
      return null
    }
  }

  /** 🔹 Criar notificação */
  const createNotification = useMutation({
    mutationFn: (notification: Omit<NotificationEntity, 'id'>) =>
      notificationService.create(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** 🔹 Atualizar notificação */
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

  /** 🔹 Deletar notificação */
  const deleteNotification = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** 🔹 Buscar notificação único (on-demand) */
  const fetchNotificationById = async (id: string) => {
    try {
      return await notificationService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar notificação:', err)
      return null
    }
  }

  /** 🔹 Buscar notification por field */
  const fetchOneNotificationByField = async (
    field: keyof NotificationEntity,
    value: string
  ) => {
    try {
      return await notificationService.getOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar notificações por campo:', err)
      return null
    }
  }

  return {
    notifications: notificationsResponse?.data ?? [],
    pagination: notificationsResponse?.pagination,
    isLoadingNotifications: loading,
    error,
    refresh: refetch,

    fetchAllNotificationsByField,
    fetchOneNotificationByField,

    createNotification,
    updateNotification,
    deleteNotification,
    fetchNotificationById
  }
}
