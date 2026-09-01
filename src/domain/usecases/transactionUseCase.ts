import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { TransactionEntity } from '@/core/entities/Transaction'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class TransactionUseCase extends BaseUseCase {
  protected readonly context = 'TransactionUseCase'

  private get repository() {
    return ApiRepository.transactions
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<TransactionEntity>
  ): Promise<ListResponseType<TransactionEntity[]>> {
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

  executeGetById(id: string): Promise<TransactionEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: FieldPath<TransactionEntity>,
    value: unknown
  ): Promise<TransactionEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<TransactionEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<TransactionEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<TransactionEntity>
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

  executeCreate(
    transaction: Omit<TransactionEntity, 'id'>
  ): Promise<TransactionEntity> {
    return this.run('create', () => this.repository.create(transaction))
  }

  executeUpdate(
    id: string,
    transaction: Partial<TransactionEntity>
  ): Promise<TransactionEntity> {
    return this.run('update', () => this.repository.update(id, transaction))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }
}

export const transactionUseCase = new TransactionUseCase()
