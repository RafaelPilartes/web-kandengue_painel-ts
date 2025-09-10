import type { ListResponseType } from '@/interfaces/IApiResponse'
import { DriverEntity } from '../entities/Driver'

export interface IDriverRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DriverEntity[]>>
  getById(id: string): Promise<ListResponseType<DriverEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DriverEntity[]>>
  create(
    Driver: Omit<DriverEntity, 'id'>
  ): Promise<ListResponseType<DriverEntity>>
  update(
    id: string,
    Driver: Partial<DriverEntity>
  ): Promise<ListResponseType<DriverEntity>>
  delete(id: string): Promise<void>
}
