import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class DocumentUseCase extends BaseUseCase {
  protected readonly context = 'DocumentUseCase'

  private get repository() {
    return ApiRepository.documents
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity[]>> {
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

  executeGetById(id: string): Promise<DocumentEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: string,
    value: unknown
  ): Promise<DocumentEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field as keyof DocumentEntity, value)
    )
  }

  executeGetAllByField(
    field: string,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DocumentEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<DocumentEntity>
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

  executeCreate(document: Omit<DocumentEntity, 'id'>): Promise<DocumentEntity> {
    return this.run('create', () => this.repository.create(document))
  }

  executeUpdate(
    id: string,
    document: Partial<DocumentEntity>
  ): Promise<DocumentEntity> {
    return this.run('update', () => this.repository.update(id, document))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }
}

export const documentUseCase = new DocumentUseCase()
