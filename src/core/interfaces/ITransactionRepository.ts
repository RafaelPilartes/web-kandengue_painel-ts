import type { ListResponseType } from '@/interfaces/IApiResponse'
import { TransactionEntity } from '../entities/Transaction'

export interface ITransactionRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<TransactionEntity[]>>
  getById(id: string): Promise<ListResponseType<TransactionEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<TransactionEntity[]>>
  create(
    Transaction: Omit<TransactionEntity, 'id'>
  ): Promise<ListResponseType<TransactionEntity>>
  update(
    id: string,
    Transaction: Partial<TransactionEntity>
  ): Promise<ListResponseType<TransactionEntity>>
  delete(id: string): Promise<void>
}
