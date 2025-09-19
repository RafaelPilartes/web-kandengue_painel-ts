import type { VehicleStatusEnumType, VehicleType } from '@/types/enum'

export interface VehicleInterface {
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
}
