// interfaces/IWallet.ts

import type { currencyEnumType, StatusEnumType } from '@/types/enum'
import type { DriverInterface } from './IDriver'

export interface WalletInterface {
  id?: string
  user: DriverInterface
  balance: number
  status: StatusEnumType
  currency: currencyEnumType
  created_at?: Date
  updated_at?: Date
}
