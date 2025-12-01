// modules/Api/firebase/notifications.dao.ts
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
  setDoc,
  orderBy,
  limit as fbLimit,
  startAfter,
  getCountFromServer
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { generateId } from '@/helpers/generateId'

export class FirebaseNotificationDAO implements INotificationRepository {
  private notificationsRef = collection(
    db,
    firebaseCollections.notifications.root
  )

  // Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<NotificationEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** Listar notifications com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<NotificationEntity>
  ): Promise<ListResponseType<NotificationEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.notificationsRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()

      baseQuery = query(
        baseQuery,
        orderBy('created_at'),
        where('title', '>=', lower),
        where('title', '<=', lower + '\uf8ff')
      )
    } else {
      // padrão: ordena por createdAt (use o campo consistente no seu DB)
      baseQuery = query(baseQuery, orderBy('created_at', 'desc'))
    }

    // 3) conta total com mesma baseQuery (opcionalmente, se quiser performance, você pode evitar)
    let total = 0
    try {
      const countSnap = await getCountFromServer(baseQuery)
      total = countSnap.data().count
    } catch (err) {
      // se count falhar, não interrompe; continua sem count
      console.warn('Erro ao obter count:', err)
    }

    // 4) se offset > 0 -> precisamos do lastVisible correspondente ao offset
    let finalQuery = query(baseQuery, fbLimit(limitValue)) // default
    if (offset > 0) {
      // NOTE: esse "skip" é caro para offsets grandes — ver nota abaixo
      const skipQuery = query(baseQuery, fbLimit(offset))
      const skipSnap = await getDocs(skipQuery)
      const lastVisible = skipSnap.docs[skipSnap.docs.length - 1]
      if (!lastVisible) {
        // offset maior do que registros existentes
        return {
          data: [],
          pagination: { limit: limitValue, offset, count: total }
        }
      }
      finalQuery = query(
        baseQuery,
        startAfter(lastVisible),
        fbLimit(limitValue)
      )
    }

    const snapshot = await getDocs(finalQuery)

    if (snapshot.empty) {
      return {
        data: [],
        pagination: { limit: limitValue, offset, count: total }
      }
    }

    const notifications = snapshot.docs.map(
      docSnap =>
        new NotificationEntity({
          ...(docSnap.data() as NotificationEntity)
        })
    )

    return {
      data: notifications,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<NotificationEntity | null> {
    const docSnap = await getDoc(doc(this.notificationsRef, id))
    if (!docSnap.exists()) return null
    const notificationData = new NotificationEntity({
      ...(docSnap.data() as NotificationEntity)
    })
    return notificationData
  }

  async getAllByField(
    field: keyof NotificationEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<NotificationEntity[]>> {
    const filters: Partial<NotificationEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(
    field: string,
    value: any
  ): Promise<NotificationEntity | null> {
    const querySnapshot = await getDocs(
      query(this.notificationsRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const notificationData = new NotificationEntity({
      ...(querySnapshot.docs[0].data() as NotificationEntity)
    })
    return notificationData
  }

  async create(
    notification: Omit<NotificationEntity, 'id'>
  ): Promise<NotificationEntity> {
    const notificationId = generateId('nft')
    const sanitized = {
      ...this.sanitize(notification),
      id: notificationId,
      created_at: new Date()
    }

    await setDoc(doc(this.notificationsRef, notificationId), sanitized)

    const notificationData = new NotificationEntity({
      id: notificationId,
      ...notification
    })
    return notificationData
  }

  async update(
    id: string,
    notification: Partial<NotificationEntity>
  ): Promise<NotificationEntity> {
    const sanitized = {
      ...this.sanitize(notification),
      updated_at: new Date()
    }
    await updateDoc(doc(this.notificationsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Notification not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.notificationsRef, id))
  }
}
