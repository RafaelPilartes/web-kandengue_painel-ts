// core/entities/Application.ts
import type { ApplicationInterface } from '@/interfaces/IApplication'
import type { ApplicationStatus } from '@/types/enum'

export class ApplicationEntity implements ApplicationInterface {
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
  // Areas
  application_areas?: string
  status: ApplicationStatus
  created_at?: Date
  updated_at?: Date
  firebase_uid?: string

  constructor(params: {
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
    identity_card?: string
    curriculum?: string
    vehicle_Doc?: string
    vehicle_photo?: string
    application_areas?: string
    status: ApplicationStatus
    created_at?: Date
    updated_at?: Date
    firebase_uid?: string
  }) {
    this.id = params.id
    this.entity_code = params.entity_code
    this.photo = params.photo
    this.first_name = params.first_name
    this.last_name = params.last_name
    this.email = params.email
    this.phone = params.phone
    this.province = params.province
    this.gender = params.gender
    this.type_candidacy = params.type_candidacy
    this.identity_card = params.identity_card
    this.curriculum = params.curriculum
    this.vehicle_Doc = params.vehicle_Doc
    this.vehicle_photo = params.vehicle_photo
    this.application_areas = params.application_areas
    this.status = params.status
    this.created_at = params.created_at
    this.updated_at = params.updated_at
    this.firebase_uid = params.firebase_uid
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.first_name?.trim()) errors.push('Nome é obrigatório')
    if (!this.last_name?.trim()) errors.push('Sobrenome é obrigatório')
    if (!this.email?.trim()) errors.push('Email é obrigatório')
    if (!this.phone?.trim()) errors.push('Telefone é obrigatório')
    if (!this.validateEmail(this.email)) errors.push('Email inválido')

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
