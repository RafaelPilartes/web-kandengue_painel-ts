/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import { NotificationEntity } from '@rafaelpilartes/kandengue-shared/entities'
export { NotificationEntity }


import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { NotificationInterface } from '@/interfaces/INotification'
import type { UserInterface } from '@/interfaces/IUser'
import type { NotificationType, NotificationCategory } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

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
