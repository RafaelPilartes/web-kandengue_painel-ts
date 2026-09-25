/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import { toDate } from '@/helpers/firestore'
import { WalletTopupRequestEntity } from '@rafaelpilartes/kandengue-shared/entities'

export { WalletTopupRequestEntity }

/**
 * Forma crua do documento em `topupRequests`, tal como o Firestore o devolve.
 * Difere de `WalletTopupRequestInterface` nas quatro datas: aqui são
 * `Timestamp`. Só o converter deve tocar neste tipo.
 */
interface WalletTopupRequestDoc
  extends Omit<
    WalletTopupRequestInterface,
    'created_at' | 'processed_at' | 'confirmed_at' | 'updated_at'
  > {
  created_at?: Timestamp | Date | string | null
  processed_at?: Timestamp | Date | string | null
  confirmed_at?: Timestamp | Date | string | null
  updated_at?: Timestamp | Date | string | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const walletTopupRequestConverter: FirestoreDataConverter<WalletTopupRequestEntity> =
  {
    toFirestore(walletTopupRequest) {
      return { ...walletTopupRequest }
    },
    fromFirestore(snapshot, options) {
      const d = snapshot.data(options) as WalletTopupRequestDoc
      return new WalletTopupRequestEntity({
        ...d,
        id: snapshot.id,
        created_at: toDate(d.created_at) ?? undefined,
        processed_at: toDate(d.processed_at) ?? undefined,
        confirmed_at: toDate(d.confirmed_at) ?? undefined,
        updated_at: toDate(d.updated_at) ?? undefined
      } as WalletTopupRequestInterface)
    }
  }
