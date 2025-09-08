import type { ListResponseType } from '@/interfaces/IApiResponse'
import { UserEntity } from '../entities/User'

export interface IUserRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<UserEntity[]>>
  getById(id: string): Promise<ListResponseType<UserEntity> | null>
  create(user: Omit<UserEntity, 'id'>): Promise<ListResponseType<UserEntity>>
  update(
    id: string,
    user: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity>>
  delete(id: string): Promise<void>
}
