import type { LiveLocationType } from '@/types/ride'

export interface RideTrackingInterface {
  id: string
  rideId: string
  path: LiveLocationType[] // todas localizações ao longo da corrida
}
