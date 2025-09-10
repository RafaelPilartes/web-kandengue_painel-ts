import type { ListResponseType } from '@/interfaces/IApiResponse'
import { RideEntity } from '../entities/Ride'

export interface IRideRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideEntity[]>>
  getById(id: string): Promise<ListResponseType<RideEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideEntity[]>>
  create(Ride: Omit<RideEntity, 'id'>): Promise<ListResponseType<RideEntity>>
  update(
    id: string,
    Ride: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity>>
  delete(id: string): Promise<void>
}
