import type { IVehicleRepository } from '@/core/interfaces/IVehicleRepository'
import { VehicleEntity } from '@/core/entities/Vehicle'
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

export class FirebaseVehicleDAO implements IVehicleRepository {
  private vehiclesRef = collection(db, firebaseCollections.vehicles.root)

  // 🔹 Remove campos undefined antes de salvar
  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(): Promise<{ data: VehicleEntity[] }> {
    const snapshot = await getDocs(this.vehiclesRef)
    const vehicles = snapshot.docs.map(
      docSnap =>
        new VehicleEntity({
          ...(docSnap.data() as VehicleEntity)
        })
    )
    return {
      data: vehicles
    }
  }

  async getById(id: string): Promise<ListResponseType<VehicleEntity> | null> {
    const docSnap = await getDoc(doc(this.vehiclesRef, id))
    if (!docSnap.exists()) return null
    const vehicleData = new VehicleEntity({
      ...(docSnap.data() as VehicleEntity)
    })
    return {
      data: vehicleData
    }
  }

  async getAllByField(
    field: keyof VehicleEntity,
    value: any
  ): Promise<ListResponseType<VehicleEntity[]>> {
    const q = query(this.vehiclesRef, where(field as string, '==', value))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) return { data: [] }

    const vehicles = querySnapshot.docs.map(
      docSnap =>
        new VehicleEntity({
          ...(docSnap.data() as VehicleEntity)
        })
    )
    return { data: vehicles }
  }

  async create(
    vehicle: Omit<VehicleEntity, 'id'>
  ): Promise<ListResponseType<VehicleEntity>> {
    const vehicleId = crypto.randomUUID()
    const sanitized = this.sanitize(vehicle)

    await setDoc(doc(this.vehiclesRef, vehicleId), sanitized)

    const vehicleData = new VehicleEntity({ id: vehicleId, ...vehicle })
    return { data: vehicleData }
  }

  async update(
    id: string,
    vehicle: Partial<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity>> {
    const sanitized = this.sanitize(vehicle)
    await updateDoc(doc(this.vehiclesRef, id), sanitized)

    const updated = await this.getById(id)
    if (!updated) throw new Error('Vehicle not found after update')

    return updated
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(this.vehiclesRef, id))
  }
}
