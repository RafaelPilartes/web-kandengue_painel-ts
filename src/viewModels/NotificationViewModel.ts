// viewModels/NotificationViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationService } from '@/routes/services/notification.service'
import { NotificationEntity } from '@/core/entities/Notification'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { withAudit } from '@/routes/services/audit.service'

const notificationService = new NotificationService()

export function useNotificationsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<NotificationEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de notificação */
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

  /** Buscar lista de notificações por field */
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

  /** Criar notificação */
  const createNotification = useMutation({
    mutationFn: async (notification: Omit<NotificationEntity, 'id'>) => {
      // 1. Gravar na Firebase + Disparar Push via API (com auditoria cruzada)
      const createdDoc = await withAudit(
        () => notificationService.createAndSendPush(notification),
        {
          action: 'create',
          module: 'notifications',
          description: `Criou notificação: ${notification.title}`,
          target_type: 'notification',
          target_label: notification.title,
          new_data: notification
        }
      )

      return createdDoc
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** Atualizar notificação */
  const updateNotification = useMutation({
    mutationFn: async ({
      id,
      notification
    }: {
      id: string
      notification: Partial<NotificationEntity>
    }) => {
      const previous_data = await notificationService
        .getById(id)
        .catch(() => null)
      return withAudit(() => notificationService.update(id, notification), {
        action: 'update',
        module: 'notifications',
        description: `Atualizou notificação - ID: ${id}`,
        target_id: id,
        target_type: 'notification',
        previous_data: previous_data || undefined,
        new_data: notification
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** Deletar notificação */
  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await notificationService
        .getById(id)
        .catch(() => null)
      return withAudit(() => notificationService.delete(id), {
        action: 'delete',
        module: 'notifications',
        description: `Excluiu notificação - ID: ${id}`,
        target_id: id,
        target_type: 'notification',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  /** Buscar notificação único (on-demand) */
  const fetchNotificationById = async (id: string) => {
    try {
      return await notificationService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar notificação:', err)
      return null
    }
  }

  /** Buscar notification por field */
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
