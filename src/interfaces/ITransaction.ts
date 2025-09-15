import type { TransactionType, TransactionCategoryType } from '@/types/enum'

export interface TransactionInterface {
  id: string
  wallet_id: string
  type: TransactionType
  category: TransactionCategoryType
  reference_id?: string // id de corrida, topup
  amount: number
  description?: string
  created_at?: Date
  updated_at?: Date
}
