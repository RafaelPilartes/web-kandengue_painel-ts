// core/entities/Notification.ts

import type { NotificationInterface } from '@/interfaces/INotification'
import type { UserInterface } from '@/interfaces/IUser'
import type { NotificationType, NotificationCategory } from '@/types/enum'

export class NotificationEntity implements NotificationInterface {
  id: string
  title: string
  message: string
  type: NotificationType
  category: NotificationCategory
  specific_user?: boolean
  user?: UserInterface
  is_read?: boolean
  created_at?: Date

  constructor(params: NotificationInterface) {
    this.id = params.id
    this.title = params.title
    this.message = params.message
    this.type = params.type
    this.category = params.category
    this.specific_user = params.specific_user
    this.user = params.user
    this.is_read = params.is_read
    this.created_at = params.created_at
  }
}
