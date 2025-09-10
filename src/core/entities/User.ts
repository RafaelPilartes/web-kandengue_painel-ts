import type { UserInterface } from '@/interfaces/IUser'
import type { UserStatus } from '@/types/enum'

export class UserEntity implements UserInterface {
  id?: string
  entity_code: string
  photo?: string
  name: string
  email: string
  phone: string
  status: UserStatus

  constructor(params: {
    id?: string
    name: string
    email: string
    entity_code: string
    photo?: string
    phone: string
    status: UserStatus
  }) {
    this.id = params.id
    this.name = params.name
    this.email = params.email
    this.entity_code = params.entity_code
    this.photo = params.photo
    this.phone = params.phone
    this.status = params.status
  }
}
