import type { AdminRole } from '../types/enum'
import type { OptionType } from '../types/option'
import type { UserInterface } from './IUser'

export interface AdminInterface extends UserInterface {
  role: AdminRole
  permissions: OptionType[]
}
