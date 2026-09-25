/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import { UserEntity, type UserEntityParams } from '@rafaelpilartes/kandengue-shared/entities'
export { UserEntity, type UserEntityParams }

import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { UserStatus } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

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
