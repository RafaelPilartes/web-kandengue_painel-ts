// core/entities/Transaction.ts

import type { TransactionInterface } from '@/interfaces/ITransaction'
import type { TransactionCategoryType, TransactionType } from '@/types/enum'

export class TransactionEntity implements TransactionInterface {
  id: string
  type: TransactionType
  category: TransactionCategoryType
  description?: string
  amount: number
  created_at: string

  constructor(params: TransactionInterface) {
    this.id = params.id
    this.type = params.type
    this.category = params.category
    this.description = params.description
    this.amount = params.amount
    this.created_at = params.created_at
  }
}
