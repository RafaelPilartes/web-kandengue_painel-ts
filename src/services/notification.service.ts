// services/notifications.service.ts
import {
  notificationRepository,
  pushNotificationRepository
} from '@/modules/Api'
import { NotificationEntity } from '@/core/entities/Notification'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

/**
 * Traduz `offset` (paginação por número de registos saltados, como o DAO
 * antigo fazia) para o cursor por `id` que o `BaseFirebaseDAO` espera.
 * Mesmo custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<NotificationEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await notificationRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class NotificationService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await notificationRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
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

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<NotificationEntity | null> {
    try {
      return await notificationRepository.getOneByField(
        field as keyof NotificationEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar notification por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar notification')
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
      const filters = { [field]: value } as Partial<NotificationEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await notificationRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

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

  async createAndSendPush(
    notification: Omit<NotificationEntity, 'id'>
  ): Promise<NotificationEntity> {
    try {
      // 1. Grava no Firebase
      const createdDoc = await notificationRepository.create(notification)

      // 2. Dispara o Push via Fastify API
      try {
        const { auth } = await import('@/config/firebase.config')
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          await pushNotificationRepository.send(createdDoc.id, token)
        } else {
          console.warn(
            'Usuário não autenticado, token ausente para disparar Push'
          )
        }
      } catch (err) {
        console.error(
          'Falha ao disparar push notification via camada REST:',
          err
        )
      }

      return createdDoc
    } catch (error: any) {
      console.error('Erro ao criar e disparar notificação:', error)
      throw new Error(error.message || 'Erro ao criar e disparar notificação')
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
