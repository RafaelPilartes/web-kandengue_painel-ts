import type { UserInterface } from './IUser'
import type { VehicleInterface } from './IVehicle'

export interface DriverInterface extends UserInterface {
  is_online: boolean
  vehicle?: VehicleInterface
  rating?: number
}
