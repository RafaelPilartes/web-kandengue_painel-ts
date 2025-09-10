// core/entities/RideTracking.ts
import type { RideTrackingInterface } from '@/interfaces/IRideTracking'
import type { LiveLocationType } from '@/types/ride'

export class RideTrackingEntity implements RideTrackingInterface {
  id: string
  rideId: string
  path: LiveLocationType[]

  constructor(params: RideTrackingInterface) {
    this.id = params.id
    this.rideId = params.rideId
    this.path = params.path
  }
}
