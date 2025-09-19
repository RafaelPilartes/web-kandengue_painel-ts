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

  type: RideType
  details?: RideDetailsType // se RideType == delivery

  created_at?: Date
  updated_at?: Date
}
