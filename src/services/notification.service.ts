// services/notifications.service.ts
import { notificationRepository } from '@/modules/Api'
import { NotificationEntity } from '@/core/entities/Notification'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class NotificationService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity[]>> {
    try {
      return await notificationRepository.getAll(
        limit,
        offset,
        searchTerm,
        filters
      )
    } catch (error: any) {
      console.error('Erro ao buscar notifications:', error)
      throw new Error(error.message || 'Erro ao buscar notificações')
    }
  }

  async getById(id: string): Promise<NotificationEntity | null> {
    try {
      return await notificationRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar notificação ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar notificação')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<NotificationEntity[]>> {
    try {
      const { data, pagination } = await notificationRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar notificação pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar notificação')
    }
  }

  async create(
    notification: Omit<NotificationEntity, 'id'>
  ): Promise<NotificationEntity> {
    try {
      return await notificationRepository.create(notification)
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error)
      throw new Error(error.message || 'Erro ao criar notificação')
    }
  }

  async update(
    id: string,
    notification: Partial<NotificationEntity>
  ): Promise<NotificationEntity> {
    try {
      return await notificationRepository.update(id, notification)
    } catch (error: any) {
      console.error(`Erro ao atualizar notificação ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar notificação')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await notificationRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar notificação ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar notificação')
    }
  }
}
