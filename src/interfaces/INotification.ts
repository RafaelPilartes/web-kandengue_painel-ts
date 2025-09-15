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
  is_read?: boolean
  created_at?: Date
}
