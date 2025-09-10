import type { ListResponseType } from '@/interfaces/IApiResponse'
import { RideRateEntity } from '../entities/RideRate'

export interface IRideRateRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideRateEntity[]>>
  getById(id: string): Promise<ListResponseType<RideRateEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideRateEntity[]>>
  create(RideRate: Omit<RideRateEntity, 'id'>): Promise<ListResponseType<RideRateEntity>>
  update(
    id: string,
    RideRate: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity>>
  delete(id: string): Promise<void>
}
