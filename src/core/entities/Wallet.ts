// core/entities/Wallet.ts

import type { WalletInterface } from '@/interfaces/IWallet'
import type { UserInterface } from '@/interfaces/IUser'

export class WalletEntity implements WalletInterface {
  id?: string
  user: UserInterface
  balance: number
  status: 'active' | 'inactive'
  currency: 'AOA' | 'USD'
  created_at: Date
  updated_at?: Date

  constructor(params: WalletInterface) {
    this.id = params.id

    this.user = params.user
    this.balance = params.balance
    this.status = params.status
    this.currency = params.currency
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}
