import type { IRideTrackingRepository } from '@/core/interfaces/IRideTrackingRepository'
import { RideTrackingEntity } from '@/core/entities/RideTracking'
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

export class FirebaseRideTrackingDAO implements IRideTrackingRepository {
  private rideTrackingsRef = collection(
    db,
    firebaseCollections.rideTrackings.root
  )

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: RideTrackingEntity[] }> {
    const snapshot = await getDocs(this.rideTrackingsRef)
    const rideTrackings = snapshot.docs.map(
      docSnap =>
        new RideTrackingEntity({
          ...(docSnap.data() as RideTrackingEntity)
        })
    )
    return {
      data: rideTrackings
    }
  }

  async getById(
    id: string
  ): Promise<ListResponseType<RideTrackingEntity> | null> {
    const docSnap = await getDoc(doc(this.rideTrackingsRef, id))
    if (!docSnap.exists()) return null
    const rideTrackingData = new RideTrackingEntity({
      ...(docSnap.data() as RideTrackingEntity)
    })
    return {
      data: rideTrackingData
    }
  }

  async getAllByField(
    field: keyof RideTrackingEntity,
    value: any
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    const q = query(this.rideTrackingsRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const rideTrackings = querySnapshot.docs.map(
      docSnap =>
        new RideTrackingEntity({
          ...(docSnap.data() as RideTrackingEntity)
        })
    )
    return { data: rideTrackings }
  }

  async create(
    rideTracking: Omit<RideTrackingEntity, 'id'>
  ): Promise<ListResponseType<RideTrackingEntity>> {
    const rideTrackingId = crypto.randomUUID()
    const sanitized = this.sanitize(rideTracking)

    await setDoc(doc(this.rideTrackingsRef, rideTrackingId), sanitized)

    const rideTrackingData = new RideTrackingEntity({
      id: rideTrackingId,
      ...rideTracking
    })
    return { data: rideTrackingData }
  }

  async update(
    id: string,
    rideTracking: Partial<RideTrackingEntity>
  ): Promise<ListResponseType<RideTrackingEntity>> {
    const sanitized = this.sanitize(rideTracking)
    await updateDoc(doc(this.rideTrackingsRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('RideTracking not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.rideTrackingsRef, id))
  }
}
