import type { IMissionProgress } from '@/interfaces/IMissionProgress'

export class MissionProgressEntity implements IMissionProgress {
  id?: string
  driver_id: string
  mission_id: string
  current_count: number
  completed_ride_ids: string[]
  is_completed: boolean
  is_paid: boolean
  type_paid?: 'cash' | 'wallet'
  completed_at?: Date
  last_updated?: Date

  constructor(params: IMissionProgress) {
    this.id = params.id
    this.driver_id = params.driver_id
    this.mission_id = params.mission_id
    this.current_count = params.current_count
    this.completed_ride_ids = params.completed_ride_ids || []
    this.is_completed = params.is_completed
    this.is_paid = params.is_paid || false
    this.type_paid = params.type_paid
    this.completed_at = params.completed_at
    this.last_updated = params.last_updated
  }
}
