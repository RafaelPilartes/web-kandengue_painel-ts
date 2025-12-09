// core/interfaces/IApplicationRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { ApplicationEntity } from '../entities/Application'

export interface IApplicationRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<ApplicationEntity>
  ): Promise<ListResponseType<ApplicationEntity[]>>
  getById(id: string): Promise<ApplicationEntity | null>
  getByEmail(email: string): Promise<ApplicationEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<ApplicationEntity[]>>
  getOneByField(field: string, value: any): Promise<ApplicationEntity | null>
  create(Application: Omit<ApplicationEntity, 'id'>): Promise<ApplicationEntity>
  update(
    id: string,
    Application: Partial<ApplicationEntity>
  ): Promise<ApplicationEntity>
  delete(id: string): Promise<void>
}
