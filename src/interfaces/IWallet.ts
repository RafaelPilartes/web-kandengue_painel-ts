// interfaces/IWallet.ts

import type { UserInterface } from './IUser'

export interface WalletInterface {
  id?: string
  user: UserInterface
  balance: number
  status: 'active' | 'inactive'
  currency: 'AOA' | 'USD'
  created_at: Date
  updated_at?: Date
}
