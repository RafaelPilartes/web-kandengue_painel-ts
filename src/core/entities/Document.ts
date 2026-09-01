// core/entities/Document.ts

import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { DocumentInterface } from '@/interfaces/IDocument'
import type { UserInterface } from '@/interfaces/IUser'
import type { DocumentType } from '@/types/document'
import type { DocumentStatus } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

export class DocumentEntity implements DocumentInterface {
  id: string
  user: UserInterface
  type: DocumentType
  url: string
  status: DocumentStatus
  feedback?: string
  vehicle_id?: string

  created_at?: Date
  updated_at?: Date

  constructor(params: DocumentInterface) {
    this.id = params.id

    this.user = params.user
    this.type = params.type
    this.url = params.url
    this.status = params.status
    this.feedback = params.feedback
    this.vehicle_id = params.vehicle_id

    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}

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
