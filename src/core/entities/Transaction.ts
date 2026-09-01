// core/entities/Transaction.ts

import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { TransactionInterface } from '@/interfaces/ITransaction'
import type {
  TransactionCategoryType,
  TransactionStatus,
  TransactionType
} from '@/types/enum'
import { toDate } from '@/helpers/firestore'

export class TransactionEntity implements TransactionInterface {
  id: string
  wallet_id: string
  user_id: string

  type: TransactionType
  category: TransactionCategoryType

  amount: number

  status: TransactionStatus

  // 🔗 ligação com origem
  reference_id?: string // wallet_topup_request_id, ride_id

  // 🔐 rastreabilidade
  provider?: 'UNITEL_MONEY'
  provider_transaction_id?: string

  description?: string

  originator_conversation_id?: string
  conversation_id?: string

  created_at?: Date
  updated_at?: Date

  constructor(params: TransactionInterface) {
    this.id = params.id
    this.wallet_id = params.wallet_id
    this.user_id = params.user_id
    this.type = params.type
    this.category = params.category
    this.amount = params.amount
    this.status = params.status
    this.reference_id = params.reference_id
    this.provider = params.provider
    this.provider_transaction_id = params.provider_transaction_id
    this.description = params.description
    this.originator_conversation_id = params.originator_conversation_id
    this.conversation_id = params.conversation_id
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}

/**
 * Forma CRUA do documento em `transactions`, tal como o Firestore o devolve.
 * Difere de `TransactionInterface` nas datas: aqui são `Timestamp`.
 * Só o converter deve tocar neste tipo.
 */
export interface TransactionDoc {
  id?: string
  wallet_id?: string
  user_id?: string
  type?: TransactionType
  category?: TransactionCategoryType
  amount?: number
  status?: TransactionStatus
  reference_id?: string
  provider?: 'UNITEL_MONEY'
  provider_transaction_id?: string
  description?: string
  originator_conversation_id?: string
  conversation_id?: string
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const transactionConverter: FirestoreDataConverter<TransactionEntity> =
  {
    toFirestore(transaction) {
      return { ...transaction }
    },
    fromFirestore(snapshot, options) {
      const d = snapshot.data(options) as TransactionDoc
      return new TransactionEntity({
        ...d,
        id: snapshot.id,
        created_at: toDate(d.created_at) ?? undefined,
        updated_at: toDate(d.updated_at) ?? undefined
      } as TransactionInterface)
    }
  }
