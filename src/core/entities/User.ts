// core/entities/User.ts
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { UserInterface } from '@/interfaces/IUser'
import type { UserStatus } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

/**
 * `id` é opcional em `UserInterface` (formulários que ainda não gravaram),
 * mas todo `UserEntity` que sai de um DAO tem sempre `id`. As subclasses
 * (`DriverEntity`, `AdminEntity`) reutilizam este tipo para o `super(params)`.
 */
export type UserEntityParams = Omit<UserInterface, 'id'> & { id: string }

export class UserEntity implements UserInterface {
  id: string
  entity_code?: string
  photo?: string
  name: string
  email: string
  phone: string
  password?: string
  status: UserStatus
  email_verified?: boolean
  phone_verified?: boolean
  created_at?: Date
  updated_at?: Date
  last_login?: Date
  firebase_uid?: string

  constructor(params: UserEntityParams) {
    this.id = params.id
    this.name = params.name
    this.email = params.email
    this.phone = params.phone
    this.password = params.password
    this.entity_code = params.entity_code
    this.photo = params.photo
    this.status = params.status
    this.email_verified = params.email_verified || false
    this.phone_verified = params.phone_verified || false
    this.created_at = params.created_at
    this.updated_at = params.updated_at
    this.last_login = params.last_login
    this.firebase_uid = params.firebase_uid
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!this.name?.trim()) errors.push('Nome é obrigatório')
    if (!this.email?.trim()) errors.push('Email é obrigatório')
    if (!this.phone?.trim()) errors.push('Telefone é obrigatório')
    if (!this.validateEmail(this.email)) errors.push('Email inválido')
    if (this.password && this.password.length < 6)
      errors.push('Senha deve ter pelo menos 6 caracteres')

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

/**
 * Forma CRUA do documento em `users`, tal como o Firestore o devolve.
 * Difere de `UserInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface UserDoc {
  id?: string
  entity_code?: string
  photo?: string
  name?: string
  email?: string
  phone?: string
  password?: string
  status?: UserStatus
  email_verified?: boolean
  phone_verified?: boolean
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
  last_login?: Timestamp | null
  firebase_uid?: string
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const userConverter: FirestoreDataConverter<UserEntity> = {
  toFirestore(user) {
    return { ...user }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as UserDoc
    return new UserEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined,
      last_login: toDate(d.last_login) ?? undefined
    } as UserEntityParams)
  }
}
