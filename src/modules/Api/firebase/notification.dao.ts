import type { INotificationRepository } from '@/core/interfaces/INotificationRepository'
import { NotificationEntity } from '@/core/entities/Notification'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

export class FirebaseNotificationDAO implements INotificationRepository {
  private notificationsRef = collection(
    db,
    firebaseCollections.notifications.root
  )

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: NotificationEntity[] }> {
    const snapshot = await getDocs(this.notificationsRef)
    const notifications = snapshot.docs.map(
      docSnap =>
        new NotificationEntity({
          ...(docSnap.data() as NotificationEntity)
        })
    )
    return {
      data: notifications
    }
  }

  async getById(
    id: string
  ): Promise<ListResponseType<NotificationEntity> | null> {
    const docSnap = await getDoc(doc(this.notificationsRef, id))
    if (!docSnap.exists()) return null
    const notificationData = new NotificationEntity({
      ...(docSnap.data() as NotificationEntity)
    })
    return {
      data: notificationData
    }
  }

  async getAllByField(
    field: keyof NotificationEntity,
    value: any
  ): Promise<ListResponseType<NotificationEntity[]>> {
    const q = query(this.notificationsRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const notifications = querySnapshot.docs.map(
      docSnap =>
        new NotificationEntity({
          ...(docSnap.data() as NotificationEntity)
        })
    )
    return { data: notifications }
  }

  async create(
    notification: Omit<NotificationEntity, 'id'>
  ): Promise<ListResponseType<NotificationEntity>> {
    const notificationId = crypto.randomUUID()
    const sanitized = this.sanitize(notification)

    await setDoc(doc(this.notificationsRef, notificationId), sanitized)

    const notificationData = new NotificationEntity({
      id: notificationId,
      ...notification
    })
    return { data: notificationData }
  }

  async update(
    id: string,
    notification: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity>> {
    const sanitized = this.sanitize(notification)
    await updateDoc(doc(this.notificationsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Notification not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.notificationsRef, id))
  }
}
