// services/transactions.service.ts
import { transactionRepository } from '@/modules/Api'
import { TransactionEntity } from '@/core/entities/Transaction'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

/**
 * Traduz `offset` (paginação por número de registos saltados, como o DAO
 * antigo fazia) para o cursor por `id` que o `BaseFirebaseDAO` espera.
 * Mesmo custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<TransactionEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await transactionRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class TransactionService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<TransactionEntity>
  ): Promise<ListResponseType<TransactionEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await transactionRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar transações:', error)
      throw new Error(error.message || 'Erro ao buscar transações')
    }
  }

  async getById(id: string): Promise<TransactionEntity | null> {
    try {
      return await transactionRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar transação ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar transação')
    }
  }

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<TransactionEntity | null> {
    try {
      return await transactionRepository.getOneByField(
        field as keyof TransactionEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar transaction por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar transaction')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<TransactionEntity[]>> {
    try {
      const filters = { [field]: value } as Partial<TransactionEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await transactionRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar transação pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar transação')
    }
  }

  async create(
    transaction: Omit<TransactionEntity, 'id'>
  ): Promise<TransactionEntity> {
    try {
      return await transactionRepository.create(transaction)
    } catch (error: any) {
      console.error('Erro ao criar transação:', error)
      throw new Error(error.message || 'Erro ao criar transação')
    }
  }

  async update(
    id: string,
    transaction: Partial<TransactionEntity>
  ): Promise<TransactionEntity> {
    try {
      return await transactionRepository.update(id, transaction)
    } catch (error: any) {
      console.error(`Erro ao atualizar transação ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar transação')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await transactionRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar transação ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar transação')
    }
  }
}
