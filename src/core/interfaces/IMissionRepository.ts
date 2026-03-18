import type { ListResponseType } from '@/interfaces/IApiResponse'
import { MissionEntity } from '../entities/Mission'
import { MissionProgressEntity } from '../entities/MissionProgress'

export interface IMissionRepository {
  // Mission CRUD
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<MissionEntity>
  ): Promise<ListResponseType<MissionEntity[]>>
  getById(id: string): Promise<MissionEntity | null>
  create(mission: Omit<MissionEntity, 'id'>): Promise<MissionEntity>
  update(id: string, mission: Partial<MissionEntity>): Promise<MissionEntity>
  delete(id: string): Promise<void>

  // Mission Progress
  getProgress(driver_id: string, mission_id: string): Promise<MissionProgressEntity | null>
  updateProgress(progress: MissionProgressEntity): Promise<MissionProgressEntity>
  getAllProgressByDriver(driver_id: string): Promise<MissionProgressEntity[]>
  
  // Realtime
  listenActiveMissions(onUpdate: (missions: MissionEntity[]) => void): () => void
  listenDriverProgress(driver_id: string, onUpdate: (progress: MissionProgressEntity[]) => void): () => void
}
