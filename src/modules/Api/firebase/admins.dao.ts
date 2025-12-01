// modules/Api/firebase/admins.dao.ts
import type { IAdminRepository } from '@/core/interfaces/IAdminRepository'
import { AdminEntity } from '@/core/entities/Admin'
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

export class FirebaseAdminDAO implements IAdminRepository {
  private adminsRef = collection(db, firebaseCollections.admins.root)

  // Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<AdminEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  // Busca todos os admins em lote
  async getAllInBatches(batchSize = 500): Promise<AdminEntity[]> {
    let lastDoc: any = null
    let allAdmins: AdminEntity[] = []

    while (true) {
      let q = query(
        this.adminsRef,
        orderBy('createdAt', 'desc'),
        fbLimit(batchSize),
        ...(lastDoc ? [startAfter(lastDoc)] : [])
      )

      const snapshot = await getDocs(q)
      if (snapshot.empty) break

      const admins = snapshot.docs.map(
        docSnap =>
          new AdminEntity({
            id: docSnap.id,
            ...(docSnap.data() as AdminEntity)
          })
      )

      allAdmins = [...allAdmins, ...admins]

      lastDoc = snapshot.docs[snapshot.docs.length - 1]
      if (snapshot.size < batchSize) break // última página
    }

    return allAdmins
  }

  /** Listar admins com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.adminsRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()
      baseQuery = query(
        baseQuery,
        orderBy('created_at'),
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

    const admins = snapshot.docs.map(
      docSnap =>
        new AdminEntity({
          id: docSnap.id,
          ...(docSnap.data() as AdminEntity)
        })
    )

    return {
      data: admins,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<AdminEntity | null> {
    const docSnap = await getDoc(doc(this.adminsRef, id))
    if (!docSnap.exists()) return null
    const adminData = new AdminEntity({
      ...(docSnap.data() as AdminEntity)
    })
    return adminData
  }

  async getByEmail(email: string): Promise<AdminEntity | null> {
    const querySnapshot = await getDocs(
      query(this.adminsRef, where('email', '==', email))
    )
    if (querySnapshot.empty) return null

    const adminData = new AdminEntity({
      id: querySnapshot.docs[0].id,
      ...(querySnapshot.docs[0].data() as AdminEntity)
    })
    return adminData
  }

  async getOneByField(field: string, value: any): Promise<AdminEntity | null> {
    const querySnapshot = await getDocs(
      query(this.adminsRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new AdminEntity({
      id: querySnapshot.docs[0].id,
      ...(querySnapshot.docs[0].data() as AdminEntity)
    })
    return adminData
  }

  async getAllByField(
    field: keyof AdminEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<AdminEntity[]>> {
    const filters: Partial<AdminEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async create(admin: Omit<AdminEntity, 'id'>): Promise<AdminEntity> {
    const adminId: string = generateId('adm')
    const sanitized = {
      ...this.sanitize(admin),
      id: adminId,
      created_at: new Date()
    }

    // Validar dados
    const validation = sanitized.validate()
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }

    await setDoc(doc(this.adminsRef, adminId), sanitized)

    const adminData = new AdminEntity({ id: adminId, ...admin })
    return adminData
  }

  async update(id: string, admin: Partial<AdminEntity>): Promise<AdminEntity> {
    const sanitized = {
      ...this.sanitize(admin),
      updated_at: new Date()
    }
    await updateDoc(doc(this.adminsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Admin not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.adminsRef, id))
  }
}
