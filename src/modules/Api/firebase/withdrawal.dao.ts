import {
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  startAfter,
  where
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '@/core/entities/Promotion'
import type { IWithdrawalRepository } from '@/core/interfaces/IWithdrawalRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'

function toDate(v: any): Date | undefined {
  if (!v) return undefined
  if (v instanceof Date) return v
  if (typeof v?.toDate === 'function') return v.toDate()
  return new Date(v)
}

function mapWithdrawal(id: string, data: any): WithdrawalRequestEntity {
  return new WithdrawalRequestEntity({
    ...data,
    id,
    created_at: toDate(data.created_at) ?? new Date(),
    reviewed_at: toDate(data.reviewed_at),
    paid_at: toDate(data.paid_at)
  })
}

function mapEarning(id: string, data: any): ReferralEarningEntity {
  return new ReferralEarningEntity({
    ...data,
    id,
    created_at: toDate(data.created_at) ?? new Date(),
    requested_at: toDate(data.requested_at),
    paid_at: toDate(data.paid_at)
  })
}

export class FirebaseWithdrawalDAO implements IWithdrawalRepository {
  private withdrawalsRef = collection(
    db,
    firebaseCollections.withdrawalRequests.root
  )
  private earningsRef = collection(
    db,
    firebaseCollections.referralEarnings.root
  )

  async getAll(
    limitValue: number = 50,
    offset = 0,
    filters?: { status?: WithdrawalStatus; user_id?: string }
  ): Promise<ListResponseType<WithdrawalRequestEntity[]>> {
    let baseQuery = query(this.withdrawalsRef, orderBy('created_at', 'desc'))
    if (filters?.status) {
      baseQuery = query(baseQuery, where('status', '==', filters.status))
    }
    if (filters?.user_id) {
      baseQuery = query(baseQuery, where('user_id', '==', filters.user_id))
    }

    let total = 0
    try {
      const countSnap = await getCountFromServer(baseQuery)
      total = countSnap.data().count
    } catch (err) {
      console.warn('Erro ao obter count de saques:', err)
    }

    let finalQuery = query(baseQuery, fbLimit(limitValue))
    if (offset > 0) {
      // NOTE: este "skip" é caro para offsets grandes — mesmo padrão
      // usado nos restantes DAOs deste projeto (ex: admins.dao.ts).
      const skipSnap = await getDocs(query(baseQuery, fbLimit(offset)))
      const lastVisible = skipSnap.docs[skipSnap.docs.length - 1]
      if (!lastVisible) {
        return { data: [], pagination: { limit: limitValue, offset, count: total } }
      }
      finalQuery = query(baseQuery, startAfter(lastVisible), fbLimit(limitValue))
    }

    const snap = await getDocs(finalQuery)
    const data = snap.docs.map(d => mapWithdrawal(d.id, d.data()))
    return {
      data,
      pagination: { limit: limitValue, offset, count: total }
    }
  }

  async getById(id: string): Promise<WithdrawalRequestEntity | null> {
    const snap = await getDoc(doc(this.withdrawalsRef, id))
    if (!snap.exists()) return null
    return mapWithdrawal(snap.id, snap.data())
  }

  async countByStatus(status: WithdrawalStatus): Promise<number> {
    const q = query(this.withdrawalsRef, where('status', '==', status))
    const c = await getCountFromServer(q)
    return c.data().count
  }

  async getEarningsByIds(ids: string[]): Promise<ReferralEarningEntity[]> {
    if (ids.length === 0) return []
    // Firestore's `in` operator suporta no máximo 30 valores por query —
    // agrupa em chunks em vez de um getDoc individual por earning.
    const CHUNK = 30
    const results: ReferralEarningEntity[] = []
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK)
      const snap = await getDocs(
        query(this.earningsRef, where(documentId(), 'in', slice))
      )
      results.push(
        ...snap.docs.map(d => mapEarning(d.id, d.data()))
      )
    }
    return results
  }

}
