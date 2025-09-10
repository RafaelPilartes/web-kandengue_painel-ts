import type { TransactionType, TransactionCategoryType } from '@/types/enum'

export interface TransactionInterface {
  id: string
  type: TransactionType
  category: TransactionCategoryType
  description?: string
  amount: number
  created_at: string
}
