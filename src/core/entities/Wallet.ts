/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import { WalletEntity } from '@rafaelpilartes/kandengue-shared/entities'
export { WalletEntity }


import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { WalletInterface } from '@/interfaces/IWallet'
import type { DriverInterface } from '@/interfaces/IDriver'
import type { currencyEnumType, StatusEnumType } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

/**
 * `id` é opcional em `WalletInterface` (formulários que ainda não gravaram),
 * mas todo `WalletEntity` que sai do DAO tem sempre `id` — é o que o motor
 * (`BaseFirebaseDAO<T extends { id: string }>`) exige.
 */
export type WalletEntityParams = Omit<WalletInterface, 'id'> & { id: string }

/**
 * Forma crua do documento em `wallets`, tal como o Firestore o devolve.
 * Difere de `WalletInterface` nas datas: aqui são `Timestamp`.
 */
export interface WalletDoc {
  id?: string
  user?: DriverInterface
  balance?: number
  status?: StatusEnumType
  currency?: currencyEnumType
  created_at?: Timestamp | Date | null
  updated_at?: Timestamp | Date | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const walletConverter: FirestoreDataConverter<WalletEntity> = {
  toFirestore(wallet) {
    return { ...wallet }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as WalletDoc
    return new WalletEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined
    } as WalletEntityParams)
  }
}
