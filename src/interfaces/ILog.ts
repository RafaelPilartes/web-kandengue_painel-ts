import type { UserInterface } from './IUser'

export interface LogInterface {
  id?: number
  user: UserInterface
  action: string
  ip_address: string
  user_agent: string
  created_at?: Date
}
