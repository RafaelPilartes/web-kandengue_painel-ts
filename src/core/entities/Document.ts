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
  /**
   * When the document stops being valid. Optional: only the ones that expire
   * carry it.
   *
   * ⚠️ **It arrives as a `Timestamp` and has to leave as a `Date`.** It is the
   * field the API writes on approval (3.7), and the one that tells an approved
   * document from an approved **expired** one — and an expired one looks
   * approved in any listing.
   */
  expires_at?: Timestamp | null
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
    const expiry = toDate(d.expires_at) ?? undefined
    const entity = new DocumentEntity({
      ...d,
      id: snapshot.id,
      expires_at: expiry,
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined
    } as DocumentInterface)

    /*
     * ⚠️ **The expiry is assigned again, by hand, and without this it never
     * reaches the screen.** Found by the independent review of phase 4.
     *
     * Lib **2.11.0**'s `DocumentEntity` — the one the panel pins — does not
     * declare `expires_at`, and a class only copies what it declares: the
     * field went into the constructor and vanished. Result: the validity
     * column said "sem validade" for **every** document, including ones just
     * approved with a date, and the "Renovar validade" action never showed up.
     *
     * With 3.0.0 installed the constructor does keep it, and this line becomes
     * a reassignment of the same **already converted** value — which is the
     * other half of the defect: without the conversion, what the new class
     * kept was the raw `Timestamp`, and `isExpired` called `.getTime()` on an
     * object that has no such method. It blew up the table render.
     *
     * This stays after the lib bump (it is not a crutch): it is what
     * guarantees the field is a `Date`, whichever version it comes from.
     */
    ;(entity as DocumentInterface & { expires_at?: Date }).expires_at = expiry

    return entity
  }
}
