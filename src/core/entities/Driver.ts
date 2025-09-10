import { UserEntity } from './User'
import type { DriverInterface } from '@/interfaces/IDriver'
import type { VehicleInterface } from '@/interfaces/IVehicle'

export class DriverEntity extends UserEntity implements DriverInterface {
  is_online: boolean
  vehicle: VehicleInterface
  rating?: number

  constructor(params: DriverInterface) {
    super(params)
    this.is_online = params.is_online
    this.vehicle = params.vehicle
    this.rating = params.rating
  }
}
