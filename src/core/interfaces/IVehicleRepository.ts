// core/interfaces/IVehicleRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { VehicleEntity } from '../entities/Vehicle'

export interface IVehicleRepository extends IBaseRepository<VehicleEntity> {}
