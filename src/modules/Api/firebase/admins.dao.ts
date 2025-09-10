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
  setDoc
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

export class FirebaseAdminDAO implements IAdminRepository {
  private adminsRef = collection(db, firebaseCollections.admins.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: AdminEntity[] }> {
    const snapshot = await getDocs(this.adminsRef)
    const admins = snapshot.docs.map(
      docSnap =>
        new AdminEntity({
          ...(docSnap.data() as AdminEntity)
        })
    )
    return {
      data: admins
    }
  }

  async getById(id: string): Promise<ListResponseType<AdminEntity> | null> {
    const docSnap = await getDoc(doc(this.adminsRef, id))
    if (!docSnap.exists()) return null
    const adminData = new AdminEntity({
      ...(docSnap.data() as AdminEntity)
    })
    return {
      data: adminData
    }
  }

  async getByEmail(
    email: string
  ): Promise<ListResponseType<AdminEntity> | null> {
    const querySnapshot = await getDocs(
      query(this.adminsRef, where('email', '==', email))
    )
    if (querySnapshot.empty) return null

    const adminData = new AdminEntity({
      id: querySnapshot.docs[0].id,
      ...(querySnapshot.docs[0].data() as AdminEntity)
    })
    return { data: adminData }
  }

  async getAllByField(
    field: keyof AdminEntity,
    value: any
  ): Promise<ListResponseType<AdminEntity[]>> {
    const q = query(this.adminsRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const admins = querySnapshot.docs.map(
      docSnap =>
        new AdminEntity({
          ...(docSnap.data() as AdminEntity)
        })
    )
    return { data: admins }
  }

  async create(
    admin: Omit<AdminEntity, 'id'>
  ): Promise<ListResponseType<AdminEntity>> {
    const adminId = crypto.randomUUID()
    const sanitized = this.sanitize(admin)

    await setDoc(doc(this.adminsRef, adminId), sanitized)

    const adminData = new AdminEntity({ id: adminId, ...admin })
    return { data: adminData }
  }

  async update(
    id: string,
    admin: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity>> {
    const sanitized = this.sanitize(admin)
    await updateDoc(doc(this.adminsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Admin not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.adminsRef, id))
  }
}
