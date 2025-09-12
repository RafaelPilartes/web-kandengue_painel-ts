// core/interfaces/IUserRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { UserEntity } from '../entities/User'

export interface IUserRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity[]>>
  getById(id: string): Promise<UserEntity | null>
  getByEmail(email: string): Promise<UserEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<UserEntity[]>>
  create(User: Omit<UserEntity, 'id'>): Promise<UserEntity>
  update(id: string, User: Partial<UserEntity>): Promise<UserEntity>
  delete(id: string): Promise<void>
}
