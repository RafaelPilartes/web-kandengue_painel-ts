// core/interfaces/IRideRateRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { RideRateEntity } from '../entities/RideRate'

export interface IRideRateRepository
  extends IBaseRepository<RideRateEntity> {}
