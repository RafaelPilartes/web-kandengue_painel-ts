import type { UserStatus } from '../types/enum';

export interface UserInterface {
  id?: string;
  entity_code?: string;
  photo?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  status: UserStatus;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
  firebase_uid?: string;
}
