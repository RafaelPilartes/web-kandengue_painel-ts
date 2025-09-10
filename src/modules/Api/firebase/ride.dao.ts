import type { IRideRepository } from '@/core/interfaces/IRideRepository'
import { RideEntity } from '@/core/entities/Ride'
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

export class FirebaseRideDAO implements IRideRepository {
  private ridesRef = collection(db, firebaseCollections.rides.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: RideEntity[] }> {
    const snapshot = await getDocs(this.ridesRef)
    const rides = snapshot.docs.map(
      docSnap =>
        new RideEntity({
          ...(docSnap.data() as RideEntity)
        })
    )
    return {
      data: rides
    }
  }

  async getById(id: string): Promise<ListResponseType<RideEntity> | null> {
    const docSnap = await getDoc(doc(this.ridesRef, id))
    if (!docSnap.exists()) return null
    const rideData = new RideEntity({
      ...(docSnap.data() as RideEntity)
    })
    return {
      data: rideData
    }
  }

  async getAllByField(
    field: keyof RideEntity,
    value: any
  ): Promise<ListResponseType<RideEntity[]>> {
    const q = query(this.ridesRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const rides = querySnapshot.docs.map(
      docSnap =>
        new RideEntity({
          ...(docSnap.data() as RideEntity)
        })
    )
    return { data: rides }
  }

  async create(
    ride: Omit<RideEntity, 'id'>
  ): Promise<ListResponseType<RideEntity>> {
    const rideId = crypto.randomUUID()
    const sanitized = this.sanitize(ride)

    await setDoc(doc(this.ridesRef, rideId), sanitized)

    const rideData = new RideEntity({ id: rideId, ...ride })
    return { data: rideData }
  }

  async update(
    id: string,
    ride: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity>> {
    const sanitized = this.sanitize(ride)
    await updateDoc(doc(this.ridesRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Ride not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.ridesRef, id))
  }
}
