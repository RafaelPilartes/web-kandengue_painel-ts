// core/interfaces/IMissionProgressRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { MissionProgressEntity } from '../entities/MissionProgress'

/**
 * Estende o motor com os três métodos próprios do progresso de missões.
 * `updateProgress` faz upsert por ID composto (`{driver_id}_{mission_id}`) —
 * a mesma convenção que a API usa em `MissionProgressRepository`.
 */
export interface IMissionProgressRepository
  extends IBaseRepository<MissionProgressEntity> {
  getProgress(
    driverId: string,
    missionId: string
  ): Promise<MissionProgressEntity | null>
  updateProgress(progress: MissionProgressEntity): Promise<MissionProgressEntity>
  getAllProgressByDriver(driverId: string): Promise<MissionProgressEntity[]>
}
