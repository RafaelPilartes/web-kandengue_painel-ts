import { notificationRepository } from '@/modules/Api'
import { NotificationEntity } from '@/core/entities/Notification'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class NotificationService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<NotificationEntity[]>> {
    try {
      const { data, pagination } = await notificationRepository.getAll(
        limit,
        offset
      )
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(
    id: string
  ): Promise<ListResponseType<NotificationEntity> | null> {
    try {
      return await notificationRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
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
        `Erro ao buscar notification pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar notification')
    }
  }

  async create(
    notification: Omit<NotificationEntity, 'id'>
  ): Promise<ListResponseType<NotificationEntity>> {
    try {
      return await notificationRepository.create(notification)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    notification: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity>> {
    try {
      return await notificationRepository.update(id, notification)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await notificationRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
