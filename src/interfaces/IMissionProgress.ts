export interface IMissionProgress {
  id?: string
  driver_id: string
  mission_id: string
  current_count: number
  completed_ride_ids: string[] // Track which rides were already counted
  is_completed: boolean
  is_paid: boolean
  type_paid?: 'cash' | 'wallet'
  completed_at?: Date
  last_updated?: Date
}
