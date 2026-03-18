// modules/Api/firebase/drivers.dao.ts
import type { IDriverRepository } from '@/core/interfaces/IDriverRepository'
import { DriverEntity } from '@/core/entities/Driver'
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
  getCountFromServer,
  onSnapshot
} from 'firebase/firestore'
import type { QuerySnapshot, QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { generateId } from '@/helpers/generateId'

export class FirebaseDriverDAO implements IDriverRepository {
  private driversRef = collection(db, firebaseCollections.drivers.root)

  // Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<DriverEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** Listar drivers com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<DriverEntity>
  ): Promise<ListResponseType<DriverEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.driversRef, filters)

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

    const drivers = snapshot.docs.map(
      docSnap =>
        new DriverEntity({
          ...(docSnap.data() as DriverEntity)
        })
    )

    return {
      data: drivers,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<DriverEntity | null> {
    const docSnap = await getDoc(doc(this.driversRef, id))
    if (!docSnap.exists()) return null
    const driverData = new DriverEntity({
      ...(docSnap.data() as DriverEntity)
    })
    return driverData
  }

  async getByEmail(email: string): Promise<DriverEntity | null> {
    const querySnapshot = await getDocs(
      query(this.driversRef, where('email', '==', email))
    )
    if (querySnapshot.empty) return null

    const driverData = new DriverEntity({
      id: querySnapshot.docs[0].id,
      ...(querySnapshot.docs[0].data() as DriverEntity)
    })
    return driverData
  }

  async getAllByField(
    field: keyof DriverEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<DriverEntity[]>> {
    const filters: Partial<DriverEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(field: string, value: any): Promise<DriverEntity | null> {
    const querySnapshot = await getDocs(
      query(this.driversRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new DriverEntity({
      ...(querySnapshot.docs[0].data() as DriverEntity)
    })
    return adminData
  }

  async create(driver: Omit<DriverEntity, 'id'>): Promise<DriverEntity> {
    const driverId = generateId('dri')
    const sanitized = {
      ...this.sanitize(driver),
      id: driverId,
      created_at: new Date()
    }

    // Validar dados
    // const validation = sanitized.validate()
    // if (!validation.isValid) {
    //   throw new Error(validation.errors.join(', '))
    // }

    await setDoc(doc(this.driversRef, driverId), sanitized)

    const driverData = new DriverEntity({ id: driverId, ...driver })
    return driverData
  }

  async update(
    id: string,
    driver: Partial<DriverEntity>
  ): Promise<DriverEntity> {
    const sanitized = {
      ...this.sanitize(driver),
      updated_at: new Date()
    }
    await updateDoc(doc(this.driversRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Driver not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.driversRef, id))
  }

  listenOnlineDrivers(
    onUpdate: (drivers: DriverEntity[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    const q = query(
      this.driversRef,
      where('is_online', '==', true),
      orderBy('updated_at', 'desc')
    )

    return onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const drivers = snapshot.docs.map((docSnap: QueryDocumentSnapshot) => {
          const data = docSnap.data() as DriverEntity
          return new DriverEntity({ ...data, id: docSnap.id })
        })
        onUpdate(drivers)
      },
      (err: Error) => {
        console.error('Erro ao escutar motoristas online:', err)
        onError?.(err)
      }
    )
  }
}
