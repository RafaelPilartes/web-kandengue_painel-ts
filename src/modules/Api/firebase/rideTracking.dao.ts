// modules/Api/firebase/rideTrackings.dao.ts
import type { IRideTrackingRepository } from '@/core/interfaces/IRideTrackingRepository'
import { RideTrackingEntity } from '@/core/entities/RideTracking'
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

export class FirebaseRideTrackingDAO implements IRideTrackingRepository {
  private rideTrackingsRef = collection(
    db,
    firebaseCollections.rideTrackings.root
  )

  // Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<RideTrackingEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** Listar rideTrackings com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<RideTrackingEntity>
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.rideTrackingsRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()
      baseQuery = query(
        baseQuery,
        orderBy('ride_id'),
        where('ride_id', '>=', lower),
        where('ride_id', '<=', lower + '\uf8ff')
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

    const rideTrackings = snapshot.docs.map(
      docSnap =>
        new RideTrackingEntity({
          ...(docSnap.data() as RideTrackingEntity)
        })
    )

    return {
      data: rideTrackings,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<RideTrackingEntity | null> {
    const docSnap = await getDoc(doc(this.rideTrackingsRef, id))
    if (!docSnap.exists()) return null
    const rideTrackingData = new RideTrackingEntity({
      ...(docSnap.data() as RideTrackingEntity)
    })
    return rideTrackingData
  }

  async getAllByField(
    field: keyof RideTrackingEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    const filters: Partial<RideTrackingEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(
    field: string,
    value: any
  ): Promise<RideTrackingEntity | null> {
    const querySnapshot = await getDocs(
      query(this.rideTrackingsRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new RideTrackingEntity({
      ...(querySnapshot.docs[0].data() as RideTrackingEntity)
    })
    return adminData
  }

  async create(
    rideTracking: Omit<RideTrackingEntity, 'id'>
  ): Promise<RideTrackingEntity> {
    const rideTrackingId = generateId('rtck')
    const sanitized = {
      ...this.sanitize(rideTracking),
      id: rideTrackingId,
      created_at: new Date()
    }

    await setDoc(doc(this.rideTrackingsRef, rideTrackingId), sanitized)

    const rideTrackingData = new RideTrackingEntity({
      id: rideTrackingId,
      ...rideTracking
    })
    return rideTrackingData
  }

  async update(
    id: string,
    rideTracking: Partial<RideTrackingEntity>
  ): Promise<RideTrackingEntity> {
    const sanitized = {
      ...this.sanitize(rideTracking),
      updated_at: new Date()
    }
    await updateDoc(doc(this.rideTrackingsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('RideTracking not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.rideTrackingsRef, id))
  }
}
