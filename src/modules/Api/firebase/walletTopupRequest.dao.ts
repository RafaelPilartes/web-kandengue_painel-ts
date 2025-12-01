// modules/Api/firebase/walletTopupRequests.dao.ts
import type { IWalletTopupRequestRepository } from '@/core/interfaces/IWalletTopupRequestRepository'
import { WalletTopupRequestEntity } from '@/core/entities/WalletTopupRequest'
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

export class FirebaseWalletTopupRequestDAO
  implements IWalletTopupRequestRepository
{
  private walletTopupRequestsRef = collection(
    db,
    firebaseCollections.requests.root
  )

  // Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(
    baseRef: any,
    filters?: Partial<WalletTopupRequestEntity>
  ) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** Listar walletTopupRequests com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<WalletTopupRequestEntity>
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.walletTopupRequestsRef, filters)

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

    const walletTopupRequests = snapshot.docs.map(
      docSnap =>
        new WalletTopupRequestEntity({
          ...(docSnap.data() as WalletTopupRequestEntity)
        })
    )

    return {
      data: walletTopupRequests,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<WalletTopupRequestEntity | null> {
    const docSnap = await getDoc(doc(this.walletTopupRequestsRef, id))
    if (!docSnap.exists()) return null
    const walletTopupRequestData = new WalletTopupRequestEntity({
      ...(docSnap.data() as WalletTopupRequestEntity)
    })
    return walletTopupRequestData
  }

  async getAllByField(
    field: keyof WalletTopupRequestEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
    const filters: Partial<WalletTopupRequestEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(
    field: string,
    value: any
  ): Promise<WalletTopupRequestEntity | null> {
    const querySnapshot = await getDocs(
      query(this.walletTopupRequestsRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new WalletTopupRequestEntity({
      ...(querySnapshot.docs[0].data() as WalletTopupRequestEntity)
    })
    return adminData
  }

  async create(
    walletTopupRequest: Omit<WalletTopupRequestEntity, 'id'>
  ): Promise<WalletTopupRequestEntity> {
    const walletTopupRequestId = generateId('wtopr')
    const sanitized = {
      ...this.sanitize(walletTopupRequest),
      id: walletTopupRequestId,
      created_at: new Date()
    }

    await setDoc(
      doc(this.walletTopupRequestsRef, walletTopupRequestId),
      sanitized
    )

    const walletTopupRequestData = new WalletTopupRequestEntity({
      id: walletTopupRequestId,
      ...walletTopupRequest
    })
    return walletTopupRequestData
  }

  async update(
    id: string,
    walletTopupRequest: Partial<WalletTopupRequestEntity>
  ): Promise<WalletTopupRequestEntity> {
    const sanitized = {
      ...this.sanitize(walletTopupRequest),
      updated_at: new Date()
    }
    await updateDoc(doc(this.walletTopupRequestsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('WalletTopupRequest not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.walletTopupRequestsRef, id))
  }
}
