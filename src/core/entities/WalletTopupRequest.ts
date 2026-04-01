// core/entities/WalletTopupRequest.ts

import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import type {
  currencyEnumType,
  WalletTopupMethodType,
  WalletTopupStatus
} from '@/types/enum'

export class WalletTopupRequestEntity implements WalletTopupRequestInterface {
  id: string
  wallet_id: string
  user_id: string

  amount: number
  currency: currencyEnumType

  method: WalletTopupMethodType
  status: WalletTopupStatus

  // 🔐 idempotência
  idempotency_key: string

  // 📲 Unitel Money
  phone_number?: string
  originator_conversation_id?: string
  conversation_id?: string
  provider_transaction_id?: string

  // 📊 controlo
  provider_status?: string
  failure_code?: string
  failure_message?: string

  // 📎 manual
  proof_url?: string

  // 👤 revisão (manual)
  reviewed_by?: string | null
  rejected_reason?: string

  // ⏱️ timestamps
  created_at?: Date
  processed_at?: Date
  confirmed_at?: Date
  updated_at?: Date

  constructor(params: WalletTopupRequestInterface) {
    this.id = params.id
    this.wallet_id = params.wallet_id
    this.user_id = params.user_id
    this.amount = params.amount
    this.currency = params.currency
    this.method = params.method
    this.status = params.status
    this.idempotency_key = params.idempotency_key
    this.phone_number = params.phone_number
    this.originator_conversation_id = params.originator_conversation_id
    this.conversation_id = params.conversation_id
    this.provider_transaction_id = params.provider_transaction_id
    this.provider_status = params.provider_status
    this.failure_code = params.failure_code
    this.failure_message = params.failure_message
    this.proof_url = params.proof_url
    this.reviewed_by = params.reviewed_by
    this.rejected_reason = params.rejected_reason
    this.created_at = params.created_at
    this.processed_at = params.processed_at
    this.confirmed_at = params.confirmed_at
    this.updated_at = params.updated_at
  }
}
