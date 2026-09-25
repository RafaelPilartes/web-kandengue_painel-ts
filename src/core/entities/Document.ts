/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { DocumentInterface } from '@/interfaces/IDocument'
import type { UserInterface } from '@/interfaces/IUser'
import type { DocumentType } from '@/types/document'
import type { DocumentStatus } from '@/types/enum'
import { toDate } from '@/helpers/firestore'
import { DocumentEntity } from '@rafaelpilartes/kandengue-shared/entities'

export { DocumentEntity }

/**
 * Forma CRUA do documento em `documents`, tal como o Firestore o devolve.
 * Difere de `DocumentInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface DocumentDoc {
  id?: string
  user?: UserInterface
  type?: DocumentType
  url?: string
  status?: DocumentStatus
  feedback?: string
  vehicle_id?: string
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const documentConverter: FirestoreDataConverter<DocumentEntity> = {
  toFirestore(document) {
    return { ...document }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as DocumentDoc
    return new DocumentEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined
    } as DocumentInterface)
  }
}
