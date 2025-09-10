import type { VehicleType } from '@/types/enum'

export interface VehicleInterface {
  id: string
  type: VehicleType
  brand: string
  model: string
  color: string
  plate: string
  image?: string
  created_at?: Date
  updated_at?: Date
}
