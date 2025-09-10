// core/entities/Ride.ts
import type { DriverInterface } from '@/interfaces/IDriver'
import type { RideInterface } from '@/interfaces/IRide'
import type { RideFareInterface } from '@/interfaces/IRideFare'
import type { UserInterface } from '@/interfaces/IUser'
import type { RideStatusType, RideType } from '@/types/enum'
import type { GeoLocationType } from '@/types/geoLocation'
import type { RideDetailsType } from '@/types/ride'

export class RideEntity implements RideInterface {
  id?: string
  user: UserInterface
  driver?: DriverInterface
  pickup: GeoLocationType
  dropoff: GeoLocationType
  status: RideStatusType

  distance: number
  duration: number

  fare: RideFareInterface

  type: RideType
  details?: RideDetailsType

  created_at?: Date
  updated_at?: Date

  constructor(params: RideInterface) {
    this.id = params.id
    this.user = params.user
    this.driver = params.driver
    this.pickup = params.pickup
    this.dropoff = params.dropoff
    this.status = params.status

    this.fare = params.fare

    this.distance = params.distance
    this.duration = params.duration

    this.type = params.type
    this.details = params.details

    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
