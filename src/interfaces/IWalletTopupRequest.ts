import type { RequestStatus, WalletTopupMethodType } from '@/types/enum'
import type { AdminInterface } from './IAdmin'

export interface WalletTopupRequestInterface {
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
}
