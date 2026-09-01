// core/interfaces/ITransactionRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { TransactionEntity } from '../entities/Transaction'

export interface ITransactionRepository
  extends IBaseRepository<TransactionEntity> {}
