// core/entities/Notification.ts

import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { NotificationInterface } from '@/interfaces/INotification'
import type { UserInterface } from '@/interfaces/IUser'
import type { NotificationType, NotificationCategory } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

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

/**
 * Forma CRUA do documento em `notifications`, tal como o Firestore o devolve.
 * Difere de `NotificationInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface NotificationDoc {
  id?: string
  title?: string
  message?: string
  type?: NotificationType
  category?: NotificationCategory
  specific_user?: boolean
  user?: UserInterface
  user_id?: string
  user_role?: 'driver' | 'passenger'
  is_read?: boolean
  sent?: boolean
  sent_at?: Timestamp | null
  created_at?: Timestamp | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const notificationConverter: FirestoreDataConverter<NotificationEntity> =
  {
    toFirestore(notification) {
      return { ...notification }
    },
    fromFirestore(snapshot, options) {
      const d = snapshot.data(options) as NotificationDoc
      return new NotificationEntity({
        ...d,
        id: snapshot.id,
        sent_at: toDate(d.sent_at) ?? undefined,
        created_at: toDate(d.created_at) ?? undefined
      } as NotificationInterface)
    }
  }
