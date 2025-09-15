// core/entities/WalletTopupRequest.ts

import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import type { AdminInterface } from '@/interfaces/IAdmin'
import type { RequestStatus, WalletTopupMethodType } from '@/types/enum'

export class WalletTopupRequestEntity implements WalletTopupRequestInterface {
  id: string
  wallet_id: string
  amount: number
  proof_url?: string // upload do comprovativo
  method: WalletTopupMethodType
  status: RequestStatus
  reviewed_by?: AdminInterface | null
  rejected_reason?: string
  created_at?: Date
  updated_at?: Date

  constructor(params: WalletTopupRequestInterface) {
    this.id = params.id

    this.wallet_id = params.wallet_id
    this.amount = params.amount
    this.proof_url = params.proof_url
    this.method = params.method
    this.status = params.status
    this.reviewed_by = params.reviewed_by
    this.rejected_reason = params.rejected_reason
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
