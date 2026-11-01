import type { AdminGender } from '@rafaelpilartes/kandengue-shared/types'
import type { AdminRole } from '../types/enum'
import type { OptionType } from '../types/option'
import type { UserInterface } from './IUser'

export interface AdminInterface extends UserInterface {
  role: AdminRole
  permissions: OptionType[]
  /**
   * Only for the greeting on the home page: "Bem-vindo" or "Bem-vinda".
   * Absent is NEUTRAL, and is never guessed from the name.
   */
  gender?: AdminGender
}
