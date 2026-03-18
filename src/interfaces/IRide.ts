import type { RideStatusType, RideType } from '@/types/enum'
import type { GeoLocationType } from '@/types/geoLocation'
import type { DriverInterface } from './IDriver'
import type { UserInterface } from './IUser'
import type { RideFareInterface } from './IRideFare'
import type { RideDetailsType } from '@/types/ride'

export interface RideInterface {
  id?: string
  user: UserInterface
  driver?: DriverInterface
  pickup: GeoLocationType
  dropoff: GeoLocationType
  status: RideStatusType

  fare: RideFareInterface

  distance: number
  duration: number

  otp_code?: string
  cancel_reason?: string
  type: RideType
  details?: RideDetailsType

  proof_pickup_photo?: string
  proof_dropoff_photo?: string
  waiting_start_at?: Date
  waiting_end_at?: Date

  completed_at?: Date
  canceled_at?: Date

  created_at?: Date
  updated_at?: Date
}
