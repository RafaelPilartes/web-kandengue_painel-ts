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
  setDoc
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

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

  async getAll(): Promise<{ data: TransactionEntity[] }> {
    const snapshot = await getDocs(this.transactionsRef)
    const transactions = snapshot.docs.map(
      docSnap =>
        new TransactionEntity({
          ...(docSnap.data() as TransactionEntity)
        })
    )
    return {
      data: transactions
    }
  }

  async getById(
    id: string
  ): Promise<ListResponseType<TransactionEntity> | null> {
    const docSnap = await getDoc(doc(this.transactionsRef, id))
    if (!docSnap.exists()) return null
    const transactionData = new TransactionEntity({
      ...(docSnap.data() as TransactionEntity)
    })
    return {
      data: transactionData
    }
  }

  async getAllByField(
    field: keyof TransactionEntity,
    value: any
  ): Promise<ListResponseType<TransactionEntity[]>> {
    const q = query(this.transactionsRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const transactions = querySnapshot.docs.map(
      docSnap =>
        new TransactionEntity({
          ...(docSnap.data() as TransactionEntity)
        })
    )
    return { data: transactions }
  }

  async create(
    transaction: Omit<TransactionEntity, 'id'>
  ): Promise<ListResponseType<TransactionEntity>> {
    const transactionId = crypto.randomUUID()
    const sanitized = this.sanitize(transaction)

    await setDoc(doc(this.transactionsRef, transactionId), sanitized)

    const transactionData = new TransactionEntity({
      id: transactionId,
      ...transaction
    })
    return { data: transactionData }
  }

  async update(
    id: string,
    transaction: Partial<TransactionEntity>
  ): Promise<ListResponseType<TransactionEntity>> {
    const sanitized = this.sanitize(transaction)
    await updateDoc(doc(this.transactionsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Transaction not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.transactionsRef, id))
  }
}
