// modules/Api/firebase/wallets.dao.ts
import type { IWalletRepository } from '@/core/interfaces/IWalletRepository'
import { WalletEntity } from '@/core/entities/Wallet'
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

export class FirebaseWalletDAO implements IWalletRepository {
  private walletsRef = collection(db, firebaseCollections.wallets.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<WalletEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** 🔹 Listar wallets com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.walletsRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()
      baseQuery = query(
        baseQuery,
        orderBy('user.email'),
        where('user.email', '>=', lower),
        where('user.email', '<=', lower + '\uf8ff')
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

    const wallets = snapshot.docs.map(
      docSnap =>
        new WalletEntity({
          ...(docSnap.data() as WalletEntity)
        })
    )

    return {
      data: wallets,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<WalletEntity | null> {
    const docSnap = await getDoc(doc(this.walletsRef, id))
    if (!docSnap.exists()) return null
    const walletData = new WalletEntity({
      ...(docSnap.data() as WalletEntity)
    })
    return walletData
  }

  async getAllByField(
    field: keyof WalletEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<WalletEntity[]>> {
    const filters: Partial<WalletEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(field: string, value: any): Promise<WalletEntity | null> {
    const querySnapshot = await getDocs(
      query(this.walletsRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new WalletEntity({
      ...(querySnapshot.docs[0].data() as WalletEntity)
    })
    return adminData
  }

  async create(wallet: Omit<WalletEntity, 'id'>): Promise<WalletEntity> {
    const walletId = generateId('wt')
    const sanitized = {
      ...this.sanitize(wallet),
      id: walletId,
      created_at: new Date()
    }

    await setDoc(doc(this.walletsRef, walletId), sanitized)

    const walletData = new WalletEntity({ id: walletId, ...wallet })
    return walletData
  }

  async update(
    id: string,
    wallet: Partial<WalletEntity>
  ): Promise<WalletEntity> {
    const sanitized = {
      ...this.sanitize(wallet),
      updated_at: new Date()
    }
    await updateDoc(doc(this.walletsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Wallet not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.walletsRef, id))
  }
}
