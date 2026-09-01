// core/interfaces/INotificationRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { NotificationEntity } from '../entities/Notification'

export interface INotificationRepository
  extends IBaseRepository<NotificationEntity> {}
