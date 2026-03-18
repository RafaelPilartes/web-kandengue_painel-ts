import type { IMission } from '@/interfaces/IMission'
import type { MissionType } from '@/types/enum'

export class MissionEntity implements IMission {
  id: string
  type: MissionType
  target: number
  reward: number
  is_active: boolean
  created_at: Date
  updated_at?: Date

  constructor(params: IMission) {
    this.id = params.id
    this.type = params.type
    this.target = params.target
    this.reward = params.reward
    this.is_active = params.is_active
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
