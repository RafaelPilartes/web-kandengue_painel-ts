// core/interfaces/INotificationRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { NotificationEntity } from '../entities/Notification'

export interface INotificationRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity[]>>
  getById(id: string): Promise<NotificationEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<NotificationEntity[]>>
  getOneByField(field: string, value: any): Promise<NotificationEntity | null>
  create(
    Notification: Omit<NotificationEntity, 'id'>
  ): Promise<NotificationEntity>
  update(
    id: string,
    Notification: Partial<NotificationEntity>
  ): Promise<NotificationEntity>
  delete(id: string): Promise<void>
}
