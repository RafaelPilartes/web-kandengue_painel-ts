/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import { ApplicationEntity } from '@rafaelpilartes/kandengue-shared/entities'
export { ApplicationEntity }

// core/entities/Application.ts
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { ApplicationStatus } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

/**
 * Forma CRUA do documento em `applications`, tal como o Firestore o devolve.
 * Difere de `ApplicationInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface ApplicationDoc {
  id?: string
  entity_code?: string
  photo?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  province?: string
  gender?: string
  type_candidacy?: string
  identity_card?: string
  identities_card?: string[]
  curriculum?: string
  vehicle_Doc?: string
  vehicle_photo?: string
  vehicle_docs?: string[]
  vehicle_photos?: string[]
  application_areas?: string
  status?: ApplicationStatus
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
  firebase_uid?: string
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const applicationConverter: FirestoreDataConverter<ApplicationEntity> = {
  toFirestore(application) {
    return { ...application }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as ApplicationDoc
    return new ApplicationEntity({
      ...d,
      id: snapshot.id,
      status: d.status ?? 'pending',
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined
    } as ConstructorParameters<typeof ApplicationEntity>[0])
  }
}
