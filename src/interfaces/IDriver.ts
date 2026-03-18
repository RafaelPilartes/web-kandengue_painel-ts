import type { UserInterface } from './IUser'
import type { VehicleInterface } from './IVehicle'
import type { GeoLocationType } from '@/types/geoLocation'

export interface DriverInterface extends UserInterface {
  is_online: boolean
  vehicle?: VehicleInterface
  rating?: number
  current_location?: GeoLocationType
}
