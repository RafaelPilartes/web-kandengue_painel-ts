// modules/Api/firebase/users.dao.ts
import type { IUserRepository } from '@/core/interfaces/IUserRepository'
import { UserEntity } from '@/core/entities/User'
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

export class FirebaseUserDAO implements IUserRepository {
  private usersRef = collection(db, firebaseCollections.users.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<UserEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** 🔹 Listar users com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.usersRef, filters)

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

    const users = snapshot.docs.map(
      docSnap =>
        new UserEntity({
          ...(docSnap.data() as UserEntity)
        })
    )

    return {
      data: users,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<UserEntity | null> {
    const docSnap = await getDoc(doc(this.usersRef, id))
    if (!docSnap.exists()) return null
    const userData = new UserEntity({
      ...(docSnap.data() as UserEntity)
    })
    return userData
  }

  async getAllByField(
    field: keyof UserEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<UserEntity[]>> {
    const filters: Partial<UserEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(field: string, value: any): Promise<UserEntity | null> {
    const querySnapshot = await getDocs(
      query(this.usersRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new UserEntity({
      ...(querySnapshot.docs[0].data() as UserEntity)
    })
    return adminData
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    const querySnapshot = await getDocs(
      query(this.usersRef, where('email', '==', email))
    )
    if (querySnapshot.empty) return null

    const userData = new UserEntity({
      id: querySnapshot.docs[0].id,
      ...(querySnapshot.docs[0].data() as UserEntity)
    })
    return userData
  }

  async create(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    const userId = generateId('us')
    const sanitized = {
      ...this.sanitize(user),
      id: userId,
      created_at: new Date()
    }

    await setDoc(doc(this.usersRef, userId), sanitized)

    const userData = new UserEntity({ id: userId, ...user })
    return userData
  }

  async update(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
    const sanitized = {
      ...this.sanitize(user),
      updated_at: new Date()
    }
    await updateDoc(doc(this.usersRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('User not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.usersRef, id))
  }
}
