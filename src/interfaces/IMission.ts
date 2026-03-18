import type { MissionType } from '@/types/enum'

export interface IMission {
  id: string
  type: MissionType
  target: number
  reward: number
  is_active: boolean
  created_at: Date
  updated_at?: Date
}
