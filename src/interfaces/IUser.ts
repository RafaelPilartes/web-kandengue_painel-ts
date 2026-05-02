import type { UserStatus, UserAvailability } from '../types/enum';
import type { LocationType } from '../types/geoLocation';

export interface UserInterface {
  id?: string;
  entity_code?: string;
  photo?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  status: UserStatus;
  availability?: UserAvailability;
  location?: LocationType;
  last_location_update?: Date;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date;
  firebase_uid?: string;
}
