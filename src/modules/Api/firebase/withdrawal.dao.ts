// modules/Api/firebase/withdrawal.dao.ts
import { collection, documentId, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity,
  referralEarningConverter,
  withdrawalRequestConverter
} from '@/core/entities/Promotion'
import type { IWithdrawalRepository } from '@/core/interfaces/IWithdrawalRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
import { ReadOnlyDAO } from './ReadOnlyDAO'

/** Firestore limita o operador `in` a 30 valores por query — agrupa em chunks. */
const IN_CHUNK = 30

export class FirebaseWithdrawalDAO
  extends ReadOnlyDAO<WithdrawalRequestEntity>
  implements IWithdrawalRepository
{
  // Segunda colecção: resolve os earnings ligados a um saque no ecrã de
  // detalhe. Não é do motor — query e converter escritos à mão.
  private earningsRef = collection(
    db,
    firebaseCollections.referralEarnings.root
  ).withConverter(referralEarningConverter)

  constructor() {
    // Sem searchField: o DAO actual não faz prefix-search sobre saques.
    super(
      firebaseCollections.withdrawalRequests.root,
      withdrawalRequestConverter,
      'wdr'
    )
  }

  async countByStatus(status: WithdrawalStatus): Promise<number> {
    return this.count({ status } as Partial<WithdrawalRequestEntity>)
  }

  async getEarningsByIds(ids: string[]): Promise<ReferralEarningEntity[]> {
    if (ids.length === 0) return []
    const results: ReferralEarningEntity[] = []
    for (let i = 0; i < ids.length; i += IN_CHUNK) {
      const slice = ids.slice(i, i + IN_CHUNK)
      const snap = await getDocs(
        query(this.earningsRef, where(documentId(), 'in', slice))
      )
      results.push(...snap.docs.map(d => d.data()))
    }
    return results
  }
}
