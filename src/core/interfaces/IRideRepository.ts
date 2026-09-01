// core/interfaces/IRideRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { RideDocEntity } from '../entities/Ride'

export interface IRideRepository extends IBaseRepository<RideDocEntity> {}
