// core/interfaces/IAdminRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { AdminEntity } from '../entities/Admin'

export interface IAdminRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity[]>>
  getById(id: string): Promise<AdminEntity | null>
  getByEmail(email: string): Promise<AdminEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminEntity[]>>
  getOneByField(field: string, value: any): Promise<AdminEntity | null>
  create(Admin: Omit<AdminEntity, 'id'>): Promise<AdminEntity>
  update(id: string, Admin: Partial<AdminEntity>): Promise<AdminEntity>
  delete(id: string): Promise<void>
}
