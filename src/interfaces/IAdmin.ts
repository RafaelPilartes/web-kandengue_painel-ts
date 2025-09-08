import type { AdminRole } from '../types/enum'
import type { OptionType } from '../types/option'
import type { UserInterface } from './IUser'

export interface AdminInterface {
  id?: string
  entity_code: string
  user: UserInterface
  role: AdminRole
  permissions: OptionType[]
  created_at?: string
  updated_at?: string
}
