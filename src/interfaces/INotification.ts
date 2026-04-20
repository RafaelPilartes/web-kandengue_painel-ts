import type { NotificationType, NotificationCategory } from '@/types/enum'
import type { UserInterface } from './IUser'

export interface NotificationInterface {
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
}
