// core/entities/RideTracking.ts
import type { RideTrackingsInterface } from '@/interfaces/IRideTracking'
import type { LiveLocationType } from '@/types/ride'

export class RideTrackingEntity implements RideTrackingsInterface {
  id: string
  ride_id: string
  path: LiveLocationType[]
  created_at?: Date

  constructor(params: RideTrackingsInterface) {
    this.id = params.id
    this.ride_id = params.ride_id
    this.path = params.path
    this.created_at = params.created_at
  }
}
