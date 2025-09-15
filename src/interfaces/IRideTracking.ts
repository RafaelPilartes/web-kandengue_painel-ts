import type { LiveLocationType } from '@/types/ride'

export interface RideTrackingsInterface {
  id: string
  ride_id: string
  path: LiveLocationType[] // todas localizações ao longo da corrida
  created_at?: Date
}
