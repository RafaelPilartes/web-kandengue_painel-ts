import type { ListResponseType } from '@/interfaces/IApiResponse'
import { AdminEntity } from '../entities/Admin'

export interface IAdminRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminEntity[]>>
  getById(id: string): Promise<ListResponseType<AdminEntity> | null>
  getByEmail(email: string): Promise<ListResponseType<AdminEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminEntity[]>>
  create(Admin: Omit<AdminEntity, 'id'>): Promise<ListResponseType<AdminEntity>>
  update(
    id: string,
    Admin: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity>>
  delete(id: string): Promise<void>
}
