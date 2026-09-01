import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { AppError } from '@/domain/errors/AppError'
import type { ApplicationEntity } from '@/core/entities/Application'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class ApplicationUseCase extends BaseUseCase {
  protected readonly context = 'ApplicationUseCase'

  private get repository() {
    return ApiRepository.applications
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<ApplicationEntity>
  ): Promise<ListResponseType<ApplicationEntity[]>> {
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

  executeGetById(id: string): Promise<ApplicationEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: FieldPath<ApplicationEntity>,
    value: unknown
  ): Promise<ApplicationEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<ApplicationEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<ApplicationEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<ApplicationEntity>
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

  executeGetByEmail(email: string): Promise<ApplicationEntity | null> {
    return this.run('getByEmail', () => this.repository.getByEmail(email))
  }

  executeCreate(
    application: Omit<ApplicationEntity, 'id'>
  ): Promise<ApplicationEntity> {
    return this.run('create', () => {
      if (
        !application.first_name ||
        !application.last_name ||
        !application.email
      ) {
        throw new AppError(
          'failed-precondition',
          'Nome, sobrenome e email são obrigatórios.'
        )
      }
      return this.repository.create(application)
    })
  }

  executeUpdate(
    id: string,
    application: Partial<ApplicationEntity>
  ): Promise<ApplicationEntity> {
    return this.run('update', () => this.repository.update(id, application))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }
}

export const applicationUseCase = new ApplicationUseCase()
