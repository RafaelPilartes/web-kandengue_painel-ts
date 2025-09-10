import type { IRideRateRepository } from '@/core/interfaces/IRideRateRepository'
import { RideRateEntity } from '@/core/entities/RideRate'
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

export class FirebaseRideRateDAO implements IRideRateRepository {
  private rideRatesRef = collection(db, firebaseCollections.rideRates.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: RideRateEntity[] }> {
    const snapshot = await getDocs(this.rideRatesRef)
    const rideRates = snapshot.docs.map(
      docSnap =>
        new RideRateEntity({
          ...(docSnap.data() as RideRateEntity)
        })
    )
    return {
      data: rideRates
    }
  }

  async getById(id: string): Promise<ListResponseType<RideRateEntity> | null> {
    const docSnap = await getDoc(doc(this.rideRatesRef, id))
    if (!docSnap.exists()) return null
    const rideRateData = new RideRateEntity({
      ...(docSnap.data() as RideRateEntity)
    })
    return {
      data: rideRateData
    }
  }

  async getAllByField(
    field: keyof RideRateEntity,
    value: any
  ): Promise<ListResponseType<RideRateEntity[]>> {
    const q = query(this.rideRatesRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const rideRates = querySnapshot.docs.map(
      docSnap =>
        new RideRateEntity({
          ...(docSnap.data() as RideRateEntity)
        })
    )
    return { data: rideRates }
  }

  async create(
    rideRate: Omit<RideRateEntity, 'id'>
  ): Promise<ListResponseType<RideRateEntity>> {
    const rideRateId = crypto.randomUUID()
    const sanitized = this.sanitize(rideRate)

    await setDoc(doc(this.rideRatesRef, rideRateId), sanitized)

    const rideRateData = new RideRateEntity({ id: rideRateId, ...rideRate })
    return { data: rideRateData }
  }

  async update(
    id: string,
    rideRate: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity>> {
    const sanitized = this.sanitize(rideRate)
    await updateDoc(doc(this.rideRatesRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('RideRate not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.rideRatesRef, id))
  }
}
