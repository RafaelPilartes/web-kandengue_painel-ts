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
  user_id?: string
  user_role?: 'driver' | 'passenger'
  is_read?: boolean
  sent?: boolean
  sent_at?: Date
  created_at?: Date

  constructor(params: NotificationInterface) {
    this.id = params.id
    this.title = params.title
    this.message = params.message
    this.type = params.type
    this.category = params.category
    this.specific_user = params.specific_user
    this.user = params.user
    this.user_id = params.user_id
    this.user_role = params.user_role
    this.is_read = params.is_read
    this.sent = params.sent
    this.sent_at = params.sent_at
    this.created_at = params.created_at
  }
}
