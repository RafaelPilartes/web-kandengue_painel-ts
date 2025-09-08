import type { IUserRepository } from '@/core/interfaces/IUserRepository'
import { UserEntity } from '@/core/entities/User'
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

export class FirebaseUserDAO implements IUserRepository {
  private usersRef = collection(db, 'users')

  async getAll(): Promise<{ data: UserEntity[] }> {
    const snapshot = await getDocs(this.usersRef)
    const users = snapshot.docs.map(
      docSnap =>
        new UserEntity({
          id: docSnap.id,
          ...(docSnap.data() as Omit<UserEntity, 'id'>)
        })
    )
    return {
      data: users
    }
  }

  async getById(id: string): Promise<ListResponseType<UserEntity> | null> {
    const docSnap = await getDoc(doc(this.usersRef, id))
    if (!docSnap.exists()) return null
    const userData = new UserEntity({
      id: docSnap.id,
      ...(docSnap.data() as Omit<UserEntity, 'id'>)
    })
    return {
      data: userData
    }
  }

  async create(
    user: Omit<UserEntity, 'id'>
  ): Promise<ListResponseType<UserEntity>> {
    const docRef = await addDoc(this.usersRef, user)
    if (!docRef.id) throw new Error('Error creating user')
    const userData = new UserEntity({ id: docRef.id, ...user })
    return { data: userData }
  }

  async update(
    id: string,
    user: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity>> {
    await updateDoc(doc(this.usersRef, id), user)
    const updated = await this.getById(id)
    if (!updated) throw new Error('User not found after update')
    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.usersRef, id))
  }
}
