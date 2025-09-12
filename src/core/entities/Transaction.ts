// core/entities/Transaction.ts

import type { DriverInterface } from '@/interfaces/IDriver'
import type { TransactionInterface } from '@/interfaces/ITransaction'
import type { TransactionCategoryType, TransactionType } from '@/types/enum'

export class TransactionEntity implements TransactionInterface {
  id: string
  driver: DriverInterface
  type: TransactionType
  category: TransactionCategoryType
  description?: string
  amount: number
  created_at: Date

  constructor(params: TransactionInterface) {
    this.id = params.id
    this.driver = params.driver
    this.type = params.type
    this.category = params.category
    this.description = params.description
    this.amount = params.amount
    this.created_at = params.created_at
  }
}
