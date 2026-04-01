import type {
  TransactionType,
  TransactionCategoryType,
  TransactionStatus
} from '@/types/enum'

export interface TransactionInterface {
  id: string
  wallet_id: string
  user_id: string

  type: TransactionType
  category: TransactionCategoryType

  amount: number

  status: TransactionStatus

  // 🔗 ligação com origem
  reference_id?: string // wallet_topup_request_id, ride_id

  // 🔐 rastreabilidade
  provider?: 'UNITEL_MONEY'
  provider_transaction_id?: string

  description?: string

  originator_conversation_id?: string
  conversation_id?: string

  created_at?: Date
  updated_at?: Date
}
