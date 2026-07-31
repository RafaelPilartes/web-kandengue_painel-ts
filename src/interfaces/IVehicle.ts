import type { Timestamp } from 'firebase/firestore'
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

/**
 * Forma CRUA do documento em `vehicles`, tal como o Firestore o devolve.
 * Difere de `VehicleInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface VehicleDoc {
  id?: string
  user_id?: string
  type?: VehicleType
  brand?: string
  model?: string
  color?: string
  plate?: string
  status?: VehicleStatusEnumType
  image?: string
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}
