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
  setDoc
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

export class FirebaseWalletDAO implements IWalletRepository {
  private walletsRef = collection(db, firebaseCollections.wallets.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: WalletEntity[] }> {
    const snapshot = await getDocs(this.walletsRef)
    const wallets = snapshot.docs.map(
      docSnap =>
        new WalletEntity({
          ...(docSnap.data() as WalletEntity)
        })
    )
    return {
      data: wallets
    }
  }

  async getById(id: string): Promise<ListResponseType<WalletEntity> | null> {
    const docSnap = await getDoc(doc(this.walletsRef, id))
    if (!docSnap.exists()) return null
    const walletData = new WalletEntity({
      ...(docSnap.data() as WalletEntity)
    })
    return {
      data: walletData
    }
  }

  async getAllByField(
    field: keyof WalletEntity,
    value: any
  ): Promise<ListResponseType<WalletEntity[]>> {
    const q = query(this.walletsRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const wallets = querySnapshot.docs.map(
      docSnap =>
        new WalletEntity({
          ...(docSnap.data() as WalletEntity)
        })
    )
    return { data: wallets }
  }

  async create(
    wallet: Omit<WalletEntity, 'id'>
  ): Promise<ListResponseType<WalletEntity>> {
    const walletId = crypto.randomUUID()
    const sanitized = this.sanitize(wallet)

    await setDoc(doc(this.walletsRef, walletId), sanitized)

    const walletData = new WalletEntity({ id: walletId, ...wallet })
    return { data: walletData }
  }

  async update(
    id: string,
    wallet: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity>> {
    const sanitized = this.sanitize(wallet)
    await updateDoc(doc(this.walletsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Wallet not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.walletsRef, id))
  }
}
