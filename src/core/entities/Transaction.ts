// core/entities/Transaction.ts

import type { TransactionInterface } from '@/interfaces/ITransaction'
import type { TransactionCategoryType, TransactionType } from '@/types/enum'

export class TransactionEntity implements TransactionInterface {
  id: string
  wallet_id: string
  type: TransactionType
  category: TransactionCategoryType
  reference_id?: string // id de corrida, topup
  amount: number
  description?: string
  created_at?: Date
  updated_at?: Date

  constructor(params: TransactionInterface) {
    this.id = params.id
    this.wallet_id = params.wallet_id
    this.type = params.type
    this.category = params.category
    this.reference_id = params.reference_id
    this.amount = params.amount
    this.description = params.description
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
