// core/entities/Vehicle.ts
import type { FirestoreDataConverter } from 'firebase/firestore'
import type { VehicleDoc, VehicleInterface } from '@/interfaces/IVehicle'
import type { VehicleStatusEnumType, VehicleType } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

export type VehicleEntityParams = Partial<
  Omit<VehicleInterface, 'id' | 'created_at' | 'updated_at'>
> & {
  id: string
  created_at?: Date | null
  updated_at?: Date | null
}

export class VehicleEntity implements VehicleInterface {
  id: string
  user_id: string
  type: VehicleType
  brand: string
  model: string
  color: string
  plate: string
  status: VehicleStatusEnumType
  image?: string
  created_at: Date
  updated_at?: Date

  constructor(params: VehicleEntityParams) {
    this.id = params.id
    this.user_id = params.user_id ?? ''
    this.type = params.type ?? 'car'
    this.brand = params.brand ?? ''
    this.model = params.model ?? ''
    this.color = params.color ?? ''
    this.plate = params.plate ?? ''
    this.status = params.status ?? 'under_analysis'
    this.image = params.image
    this.created_at = params.created_at ?? new Date()
    // Fronteira de ausência: o Firestore guarda `null`, a aplicação usa
    // `undefined` — um só valor de ausência, igual ao resto do codebase.
    this.updated_at = params.updated_at ?? undefined
  }
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const vehicleConverter: FirestoreDataConverter<VehicleEntity> = {
  toFirestore(vehicle) {
    return { ...vehicle }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as VehicleDoc
    return new VehicleEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at),
      updated_at: toDate(d.updated_at)
    })
  }
}
