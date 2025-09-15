// modules/Api/firebase/rides.dao.ts
import type { IRideRepository } from '@/core/interfaces/IRideRepository'
import { RideEntity } from '@/core/entities/Ride'
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

export class FirebaseRideDAO implements IRideRepository {
  private ridesRef = collection(db, firebaseCollections.rides.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<RideEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** 🔹 Listar rides com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.ridesRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()
      baseQuery = query(
        baseQuery,
        orderBy('id'),
        where('id', '>=', lower),
        where('id', '<=', lower + '\uf8ff')
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

    const rides = snapshot.docs.map(
      docSnap =>
        new RideEntity({
          ...(docSnap.data() as RideEntity)
        })
    )

    return {
      data: rides,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<RideEntity | null> {
    const docSnap = await getDoc(doc(this.ridesRef, id))
    if (!docSnap.exists()) return null
    const rideData = new RideEntity({
      ...(docSnap.data() as RideEntity)
    })
    return rideData
  }

  async getAllByField(
    field: keyof RideEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<RideEntity[]>> {
    const filters: Partial<RideEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async create(ride: Omit<RideEntity, 'id'>): Promise<RideEntity> {
    const rideId = generateId('rid')
    const sanitized = {
      ...this.sanitize(ride),
      id: rideId,
      created_at: new Date()
    }

    await setDoc(doc(this.ridesRef, rideId), sanitized)

    const rideData = new RideEntity({ id: rideId, ...ride })
    return rideData
  }

  async update(id: string, ride: Partial<RideEntity>): Promise<RideEntity> {
    const sanitized = {
      ...this.sanitize(ride),
      updated_at: new Date()
    }
    await updateDoc(doc(this.ridesRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Ride not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.ridesRef, id))
  }
}
