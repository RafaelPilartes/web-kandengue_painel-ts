// modules/Api/firebase/transactions.dao.ts
import type { ITransactionRepository } from '@/core/interfaces/ITransactionRepository'
import { TransactionEntity } from '@/core/entities/Transaction'
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

export class FirebaseTransactionDAO implements ITransactionRepository {
  private transactionsRef = collection(
    db,
    firebaseCollections.transactions.root
  )

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  // helper: aplica filtros (where) sobre um ref/q
  private applyFilters(baseRef: any, filters?: Partial<TransactionEntity>) {
    let q: any = baseRef
    if (!filters) return q

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== '') {
        q = query(q, where(field as string, '==', value))
      }
    })
    return q
  }

  /** 🔹 Listar transactions com paginação + pesquisa opcional */
  async getAll(
    limitValue: number = 500,
    offset = 0,
    searchTerm?: string,
    filters?: Partial<TransactionEntity>
  ): Promise<ListResponseType<TransactionEntity[]>> {
    // 1) constrói query base aplicando filtros
    let baseQuery: any = this.applyFilters(this.transactionsRef, filters)

    // 2) se tiver searchTerm
    const search = searchTerm?.toString().trim()
    if (search) {
      const lower = search.toLowerCase()
      baseQuery = query(
        baseQuery,
        orderBy('description'),
        where('description', '>=', lower),
        where('description', '<=', lower + '\uf8ff')
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

    const transactions = snapshot.docs.map(
      docSnap =>
        new TransactionEntity({
          ...(docSnap.data() as TransactionEntity)
        })
    )

    return {
      data: transactions,
      pagination: {
        limit: limitValue,
        offset,
        count: total
      }
    }
  }

  async getById(id: string): Promise<TransactionEntity | null> {
    const docSnap = await getDoc(doc(this.transactionsRef, id))
    if (!docSnap.exists()) return null
    const transactionData = new TransactionEntity({
      ...(docSnap.data() as TransactionEntity)
    })
    return transactionData
  }

  async getAllByField(
    field: keyof TransactionEntity,
    value: any,
    limit = 10,
    offset = 0
  ): Promise<ListResponseType<TransactionEntity[]>> {
    const filters: Partial<TransactionEntity> = { [field]: value } as any
    return this.getAll(limit, offset, undefined, filters)
  }

  async getOneByField(
    field: string,
    value: any
  ): Promise<TransactionEntity | null> {
    const querySnapshot = await getDocs(
      query(this.transactionsRef, where(field, '==', value))
    )
    if (querySnapshot.empty) return null

    const adminData = new TransactionEntity({
      ...(querySnapshot.docs[0].data() as TransactionEntity)
    })
    return adminData
  }

  async create(
    transaction: Omit<TransactionEntity, 'id'>
  ): Promise<TransactionEntity> {
    const transactionId = generateId('wt')
    const sanitized = {
      ...this.sanitize(transaction),
      id: transactionId,
      created_at: new Date()
    }

    await setDoc(doc(this.transactionsRef, transactionId), sanitized)

    const transactionData = new TransactionEntity({
      id: transactionId,
      ...transaction
    })
    return transactionData
  }

  async update(
    id: string,
    transaction: Partial<TransactionEntity>
  ): Promise<TransactionEntity> {
    const sanitized = {
      ...this.sanitize(transaction),
      updated_at: new Date()
    }
    await updateDoc(doc(this.transactionsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Transaction not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.transactionsRef, id))
  }
}
