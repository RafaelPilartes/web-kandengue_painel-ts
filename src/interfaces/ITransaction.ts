import type { TransactionType, TransactionCategoryType } from '@/types/enum'
import type { DriverInterface } from './IDriver'

export interface TransactionInterface {
  id: string
  driver: DriverInterface
  type: TransactionType
  category: TransactionCategoryType
  description?: string
  amount: number
  created_at: Date
}
