// modules/Api/firebase/notification.dao.ts
import type { INotificationRepository } from '@/core/interfaces/INotificationRepository'
import {
  NotificationEntity,
  notificationConverter
} from '@/core/entities/Notification'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseNotificationDAO
  extends BaseFirebaseDAO<NotificationEntity>
  implements INotificationRepository
{
  constructor() {
    super(
      firebaseCollections.notifications.root,
      notificationConverter,
      'nft',
      'title'
    )
  }
}
