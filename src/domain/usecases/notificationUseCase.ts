import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { NotificationEntity } from '@/core/entities/Notification'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class NotificationUseCase extends BaseUseCase {
  protected readonly context = 'NotificationUseCase'

  private get repository() {
    return ApiRepository.notifications
  }

  private get pushRepository() {
    return ApiRepository.pushNotifications
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity[]>> {
    return this.run('getAll', async () => {
      const base = { searchTerm, filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)
      return this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    })
  }

  executeGetById(id: string): Promise<NotificationEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: FieldPath<NotificationEntity>,
    value: unknown
  ): Promise<NotificationEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<NotificationEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<NotificationEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<NotificationEntity>
      const base = { filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)

      const { data, pagination } = await this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    })
  }

  executeCreate(
    notification: Omit<NotificationEntity, 'id'>
  ): Promise<NotificationEntity> {
    return this.run('create', () => this.repository.create(notification))
  }

  executeCreateAndSendPush(
    notification: Omit<NotificationEntity, 'id'>
  ): Promise<NotificationEntity> {
    return this.run('createAndSendPush', async () => {
      // 1. Grava no Firebase
      const createdDoc = await this.repository.create(notification)

      // 2. Dispara o Push via Fastify API
      try {
        const { auth } = await import('@/config/firebase.config')
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          await this.pushRepository.send(createdDoc.id, token)
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
    })
  }

  /*
   * ⚠️ **Não há `executeUpdate`.** As regras passaram `notifications` a
   * `allow update: if false` — o `allow update: if autenticado()` que lá
   * estava deixava qualquer sessão reescrever qualquer notificação. O método
   * que aqui estava não era chamado por nenhum ecrã, e passaria a rebentar.
   * Quando as apps precisarem de marcar como lida, é um `PATCH` na API.
   */

  /**
   * Apaga pela API, com o conteúdo anterior em `auditLogs`.
   *
   * As regras sempre negaram o `delete` ao cliente, por isso o botão do
   * painel **nunca funcionou**: mostrava "Erro ao excluir notificação" e
   * ninguém tinha percebido porquê.
   */
  executeDelete(id: string): Promise<{ id: string; deleted: boolean }> {
    return ApiRepository.adminNotifications.deleteNotification(id)
  }
}

export const notificationUseCase = new NotificationUseCase()
