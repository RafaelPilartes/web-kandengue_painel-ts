import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/services/notification.service'
import { NotificationEntity } from '@/core/entities/Notification'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const notificationService = new NotificationService()

export function useNotificationsViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de notifications */
  const {
    data: notificationsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<NotificationEntity[]>>({
    queryKey: ['notifications', limit, offset],
    queryFn: () => notificationService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de notifications por field */
  const fetchAllNotificationSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await notificationService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar notifications por campo:', err)
      return null
    }
  }

  /** 🔹 Criar notification */
  const createNotification = useMutation({
    mutationFn: (notification: Omit<NotificationEntity, 'id'>) =>
      notificationService.create(notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** 🔹 Atualizar notification */
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

  /** 🔹 Deletar notification */
  const deleteNotification = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** 🔹 Buscar notification único (on-demand) */
  const fetchNotificationById = async (id: string) => {
    try {
      return await notificationService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar notification:', err)
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
