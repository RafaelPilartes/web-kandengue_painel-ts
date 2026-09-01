// modules/Api/firebase/transaction.dao.ts
import type { ITransactionRepository } from '@/core/interfaces/ITransactionRepository'
import {
  TransactionEntity,
  transactionConverter
} from '@/core/entities/Transaction'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseTransactionDAO
  extends BaseFirebaseDAO<TransactionEntity>
  implements ITransactionRepository
{
  constructor() {
    // Prefixo `tra`, não `wt` (esse é das carteiras) — as transacções
    // escritas pela app do motorista usam `tra`. Só afecta IDs novos.
    super(
      firebaseCollections.transactions.root,
      transactionConverter,
      'tra',
      'description'
    )
  }
}
