// core/entities/Vehicle.ts
import type { VehicleInterface } from '@/interfaces/IVehicle'
import type { VehicleStatusEnumType, VehicleType } from '@/types/enum'

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
  created_at?: Date
  updated_at?: Date

  constructor(params: VehicleInterface) {
    this.id = params.id
    this.user_id = params.user_id
    this.type = params.type
    this.brand = params.brand
    this.model = params.model
    this.color = params.color
    this.plate = params.plate
    this.status = params.status
    this.image = params.image
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
