// core/interfaces/IRideTrackingRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { RideTrackingEntity } from '../entities/RideTracking'

export interface IRideTrackingRepository
  extends IBaseRepository<RideTrackingEntity> {}
