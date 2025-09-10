import type { AdminInterface } from '@/interfaces/IAdmin'
import type { AdminRole } from '@/types/enum'
import type { OptionType } from '@/types/option'
import { UserEntity } from './User'

export class AdminEntity extends UserEntity implements AdminInterface {
  role: AdminRole
  permissions: OptionType[]

  constructor(params: AdminInterface) {
    super(params)
    this.role = params.role
    this.permissions = params.permissions
  }
}
