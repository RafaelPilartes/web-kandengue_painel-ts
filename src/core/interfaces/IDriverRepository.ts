// core/interfaces/IDriverRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { DriverEntity } from '../entities/Driver'

export interface IDriverRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DriverEntity>
  ): Promise<ListResponseType<DriverEntity[]>>
  getById(id: string): Promise<DriverEntity | null>
  getByEmail(email: string): Promise<DriverEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DriverEntity[]>>
  create(Driver: Omit<DriverEntity, 'id'>): Promise<DriverEntity>
  update(id: string, Driver: Partial<DriverEntity>): Promise<DriverEntity>
  delete(id: string): Promise<void>
}
