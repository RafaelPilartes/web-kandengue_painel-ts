import type { ListResponseType } from '@/interfaces/IApiResponse'
import { RideTrackingEntity } from '../entities/RideTracking'

export interface IRideTrackingRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideTrackingEntity[]>>
  getById(id: string): Promise<ListResponseType<RideTrackingEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideTrackingEntity[]>>
  create(
    RideTracking: Omit<RideTrackingEntity, 'id'>
  ): Promise<ListResponseType<RideTrackingEntity>>
  update(
    id: string,
    RideTracking: Partial<RideTrackingEntity>
  ): Promise<ListResponseType<RideTrackingEntity>>
  delete(id: string): Promise<void>
}
