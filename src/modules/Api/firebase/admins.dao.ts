import type { IAdminRepository } from '@/core/interfaces/IAdminRepository'
import { AdminEntity } from '@/core/entities/Admin'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class FirebaseAdminDAO implements IAdminRepository {
  private adminsRef = collection(db, 'admins')

  async getAll(): Promise<{ data: AdminEntity[] }> {
    const snapshot = await getDocs(this.adminsRef)
    const admins = snapshot.docs.map(
      docSnap =>
        new AdminEntity({
          id: docSnap.id,
          ...(docSnap.data() as Omit<AdminEntity, 'id'>)
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
      id: docSnap.id,
      ...(docSnap.data() as Omit<AdminEntity, 'id'>)
    })
    return {
      data: adminData
    }
  }

  async create(
    admin: Omit<AdminEntity, 'id'>
  ): Promise<ListResponseType<AdminEntity>> {
    const docRef = await addDoc(this.adminsRef, admin)
    if (!docRef.id) throw new Error('Error creating admin')
    const adminData = new AdminEntity({ id: docRef.id, ...admin })
    return { data: adminData }
  }

  async update(
    id: string,
    admin: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity>> {
    await updateDoc(doc(this.adminsRef, id), admin)
    const updated = await this.getById(id)
    if (!updated) throw new Error('Admin not found after update')
    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.adminsRef, id))
  }
}
