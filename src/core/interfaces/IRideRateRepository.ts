// core/interfaces/IRideRateRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { RideRateEntity } from '../entities/RideRate'

export interface IRideRateRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity[]>>
  getById(id: string): Promise<RideRateEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideRateEntity[]>>
  getOneByField(field: string, value: any): Promise<RideRateEntity | null>
  create(RideRate: Omit<RideRateEntity, 'id'>): Promise<RideRateEntity>
  update(id: string, RideRate: Partial<RideRateEntity>): Promise<RideRateEntity>
  delete(id: string): Promise<void>
}
