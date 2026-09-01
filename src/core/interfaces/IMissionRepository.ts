// core/interfaces/IMissionRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { MissionEntity } from '../entities/Mission'

export interface IMissionRepository extends IBaseRepository<MissionEntity> {}
