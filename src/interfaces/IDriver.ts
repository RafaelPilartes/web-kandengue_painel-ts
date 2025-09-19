import type { UserInterface } from './IUser'
import type { VehicleInterface } from './IVehicle'

export interface DriverInterface extends UserInterface {
  vehicle?: VehicleInterface
  rating?: number
  is_online: boolean
}
