// modules/Api/firebase/rideRates.dao.ts
import type { IRideRateRepository } from '@/core/interfaces/IRideRateRepository'
import { RideRateEntity } from '@/core/entities/RideRate'
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

export class FirebaseRideRateDAO implements IRideRateRepository {
  private rideRatesRef = collection(db, firebaseCollections.rideRates.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<RideRateEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** 🔹 Listar rideRates com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.rideRatesRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()
      baseQuery = query(
        baseQuery,
        orderBy('email'),
        where('email', '>=', lower),
        where('email', '<=', lower + '\uf8ff')
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

    // 5) retorna
    const rideRates = snapshot.docs.map(
      docSnap =>
        new RideRateEntity({
          ...(docSnap.data() as RideRateEntity)
        })
    )

    // console.log('rideRates ==', rideRates[0])
    // console.log('rideRates ??', snapshot.empty)

    return {
      data: rideRates,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<RideRateEntity | null> {
    const docSnap = await getDoc(doc(this.rideRatesRef, id))
    if (!docSnap.exists()) return null
    const rideRateData = new RideRateEntity({
      ...(docSnap.data() as RideRateEntity)
    })
    return rideRateData
  }

  async getAllByField(
    field: keyof RideRateEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<RideRateEntity[]>> {
    const filters: Partial<RideRateEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async create(rideRate: Omit<RideRateEntity, 'id'>): Promise<RideRateEntity> {
    const rideRateId = generateId('rate')
    const sanitized = {
      ...this.sanitize(rideRate),
      id: rideRateId,
      created_at: new Date()
    }

    await setDoc(doc(this.rideRatesRef, rideRateId), sanitized)

    const rideRateData = new RideRateEntity({ id: rideRateId, ...rideRate })
    return rideRateData
  }

  async update(
    id: string,
    rideRate: Partial<RideRateEntity>
  ): Promise<RideRateEntity> {
    const sanitized = {
      ...this.sanitize(rideRate),
      updated_at: new Date()
    }
    await updateDoc(doc(this.rideRatesRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('RideRate not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.rideRatesRef, id))
  }
}
