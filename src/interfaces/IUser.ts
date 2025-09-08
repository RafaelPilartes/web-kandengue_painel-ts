import type { UserStatus } from '../types/enum'

export interface UserInterface {
  id?: string
  entity_code: string
  photo?: string
  name: string
  email: string
  phone: string
  status: UserStatus
  created_at?: string
  updated_at?: string
}
