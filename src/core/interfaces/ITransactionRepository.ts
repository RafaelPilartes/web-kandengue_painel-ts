// core/interfaces/ITransactionRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { TransactionEntity } from '../entities/Transaction'

export interface ITransactionRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<TransactionEntity>
  ): Promise<ListResponseType<TransactionEntity[]>>
  getById(id: string): Promise<TransactionEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<TransactionEntity[]>>
  getOneByField(field: string, value: any): Promise<TransactionEntity | null>
  create(Transaction: Omit<TransactionEntity, 'id'>): Promise<TransactionEntity>
  update(
    id: string,
    Transaction: Partial<TransactionEntity>
  ): Promise<TransactionEntity>
  delete(id: string): Promise<void>
}
