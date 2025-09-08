import type { AdminRole, UserStatus } from '@/types/enum'
import type { OptionType } from '@/types/option'

export class AdminEntity {
  id?: string
  entity_code: string
  photo?: string
  name: string
  email: string
  phone: string
  status: UserStatus
  role: AdminRole
  permissions: OptionType[]

  constructor(params: {
    id?: string
    entity_code: string
    name: string
    email: string
    photo?: string
    phone: string
    status: UserStatus
    role: AdminRole
    permissions: OptionType[]
  }) {
    this.id = params.id
    this.entity_code = params.entity_code
    this.name = params.name
    this.email = params.email
    this.photo = params.photo
    this.phone = params.phone
    this.status = params.status
    this.role = params.role
    this.permissions = params.permissions
  }
}
