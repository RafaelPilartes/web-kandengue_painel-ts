import type { ApplicationStatus } from '../types/enum'

export type ApplicationInterface = {
  id?: string
  entity_code?: string
  photo?: string
  first_name: string
  last_name: string
  email: string
  phone: string
  province: string
  gender: string
  type_candidacy?: string
  // BI
  identity_card?: string
  identities_card?: string[]
  // CV
  curriculum?: string
  // Vehicle
  vehicle_Doc?: string
  vehicle_photo?: string
  vehicle_docs?: string[]
  vehicle_photos?: string[]
  // Area
  application_areas?: string
  status: ApplicationStatus
  created_at?: Date
  updated_at?: Date
  firebase_uid?: string
}
export type ApplicationCredentialInterface = {
  email: string
  password: string
}
