import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { AppError } from '@/domain/errors/AppError'
import type { AdminEntity } from '@/core/entities/Admin'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class AdminUseCase extends BaseUseCase {
  protected readonly context = 'AdminUseCase'

  private get repository() {
    return ApiRepository.admins
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity[]>> {
    return this.run('getAll', async () => {
      const base = { searchTerm, filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)
      return this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    })
  }

  executeGetById(id: string): Promise<AdminEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetByEmail(email: string): Promise<AdminEntity | null> {
    return this.run('getByEmail', () => this.repository.getByEmail(email))
  }

  executeGetOneByField(
    field: FieldPath<AdminEntity>,
    value: unknown
  ): Promise<AdminEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<AdminEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<AdminEntity>
      const base = { filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)

      const { data, pagination } = await this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    })
  }

  executeCreate(admin: Omit<AdminEntity, 'id'>): Promise<AdminEntity> {
    return this.run('create', () => {
      if (!admin.name || !admin.email) {
        throw new AppError(
          'failed-precondition',
          'Nome e email são obrigatórios.'
        )
      }
      return this.repository.create(admin)
    })
  }

  executeUpdate(
    id: string,
    admin: Partial<AdminEntity>
  ): Promise<AdminEntity> {
    return this.run('update', () => this.repository.update(id, admin))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }
}

export const adminUseCase = new AdminUseCase()
