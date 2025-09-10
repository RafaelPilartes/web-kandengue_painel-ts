import type { ListResponseType } from '@/interfaces/IApiResponse'
import { NotificationEntity } from '../entities/Notification'

export interface INotificationRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<NotificationEntity[]>>
  getById(id: string): Promise<ListResponseType<NotificationEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<NotificationEntity[]>>
  create(
    Notification: Omit<NotificationEntity, 'id'>
  ): Promise<ListResponseType<NotificationEntity>>
  update(
    id: string,
    Notification: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity>>
  delete(id: string): Promise<void>
}
