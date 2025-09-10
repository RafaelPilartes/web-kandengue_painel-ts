import type { IDriverRepository } from '@/core/interfaces/IDriverRepository'
import { DriverEntity } from '@/core/entities/Driver'
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

export class FirebaseDriverDAO implements IDriverRepository {
  private driversRef = collection(db, firebaseCollections.drivers.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: DriverEntity[] }> {
    const snapshot = await getDocs(this.driversRef)
    const drivers = snapshot.docs.map(
      docSnap =>
        new DriverEntity({
          ...(docSnap.data() as DriverEntity)
        })
    )
    return {
      data: drivers
    }
  }

  async getById(id: string): Promise<ListResponseType<DriverEntity> | null> {
    const docSnap = await getDoc(doc(this.driversRef, id))
    if (!docSnap.exists()) return null
    const driverData = new DriverEntity({
      ...(docSnap.data() as DriverEntity)
    })
    return {
      data: driverData
    }
  }

  async getByEmail(
    email: string
  ): Promise<ListResponseType<DriverEntity> | null> {
    const querySnapshot = await getDocs(
      query(this.driversRef, where('email', '==', email))
    )
    if (querySnapshot.empty) return null

    const driverData = new DriverEntity({
      id: querySnapshot.docs[0].id,
      ...(querySnapshot.docs[0].data() as DriverEntity)
    })
    return { data: driverData }
  }

  async getAllByField(
    field: keyof DriverEntity,
    value: any
  ): Promise<ListResponseType<DriverEntity[]>> {
    const q = query(this.driversRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const drivers = querySnapshot.docs.map(
      docSnap =>
        new DriverEntity({
          ...(docSnap.data() as DriverEntity)
        })
    )
    return { data: drivers }
  }

  async create(
    driver: Omit<DriverEntity, 'id'>
  ): Promise<ListResponseType<DriverEntity>> {
    const driverId = crypto.randomUUID()
    const sanitized = this.sanitize(driver)

    await setDoc(doc(this.driversRef, driverId), sanitized)

    const driverData = new DriverEntity({ id: driverId, ...driver })
    return { data: driverData }
  }

  async update(
    id: string,
    driver: Partial<DriverEntity>
  ): Promise<ListResponseType<DriverEntity>> {
    const sanitized = this.sanitize(driver)
    await updateDoc(doc(this.driversRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Driver not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.driversRef, id))
  }
}
