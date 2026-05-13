import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  runTransaction,
  Timestamp,
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
import type { WithdrawalStatus } from '@/interfaces/IPromotion'

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
    _offset = 0,
    filters?: { status?: WithdrawalStatus; user_id?: string }
  ): Promise<ListResponseType<WithdrawalRequestEntity[]>> {
    let q = query(this.withdrawalsRef, orderBy('created_at', 'desc'))
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status))
    }
    if (filters?.user_id) {
      q = query(q, where('user_id', '==', filters.user_id))
    }
    q = query(q, fbLimit(limitValue))

    const snap = await getDocs(q)
    const data = snap.docs.map(d => mapWithdrawal(d.id, d.data()))
    return {
      data,
      pagination: { limit: limitValue, offset: 0, count: data.length }
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
    const snaps = await Promise.all(
      ids.map(id => getDoc(doc(this.earningsRef, id)))
    )
    return snaps
      .filter(s => s.exists())
      .map(s => mapEarning(s.id, s.data()))
  }

  async approve(id: string, adminId: string): Promise<void> {
    await runTransaction(db, async tx => {
      const ref = doc(this.withdrawalsRef, id)
      const snap = await tx.get(ref)
      if (!snap.exists()) throw new Error('Withdrawal not found')
      const data = snap.data() as { status?: WithdrawalStatus }
      if (data.status !== 'pending') {
        throw new Error('Apenas saques pendentes podem ser aprovados')
      }
      tx.update(ref, {
        status: 'approved' as WithdrawalStatus,
        reviewed_by: adminId,
        reviewed_at: Timestamp.now()
      })
    })
  }

  async reject(
    id: string,
    adminId: string,
    reason: string
  ): Promise<void> {
    await runTransaction(db, async tx => {
      const ref = doc(this.withdrawalsRef, id)
      const snap = await tx.get(ref)
      if (!snap.exists()) throw new Error('Withdrawal not found')
      const data = snap.data() as {
        status?: WithdrawalStatus
        earning_ids?: string[]
      }

      if (!['pending', 'approved'].includes(data.status ?? '')) {
        throw new Error('Saque não pode ser rejeitado neste estado')
      }

      const earningIds = data.earning_ids ?? []
      // Lê todos os earnings antes de qualquer write (regra Firestore).
      const earningRefs = earningIds.map(eid =>
        doc(this.earningsRef, eid)
      )
      const earningSnaps = await Promise.all(
        earningRefs.map(r => tx.get(r))
      )

      // Reverte cada earning para 'pending' — evita buraco negro financeiro.
      for (let i = 0; i < earningSnaps.length; i++) {
        const s = earningSnaps[i]
        if (!s.exists()) continue
        tx.update(earningRefs[i], {
          status: 'pending',
          requested_at: null
        })
      }

      tx.update(ref, {
        status: 'rejected' as WithdrawalStatus,
        admin_notes: reason,
        reviewed_by: adminId,
        reviewed_at: Timestamp.now()
      })
    })
  }

  async markAsPaid(id: string, adminId: string): Promise<void> {
    await runTransaction(db, async tx => {
      const ref = doc(this.withdrawalsRef, id)
      const snap = await tx.get(ref)
      if (!snap.exists()) throw new Error('Withdrawal not found')
      const data = snap.data() as {
        status?: WithdrawalStatus
        earning_ids?: string[]
      }

      if (!['approved', 'pending'].includes(data.status ?? '')) {
        throw new Error('Saque não pode ser marcado como pago neste estado')
      }

      const earningIds = data.earning_ids ?? []
      const earningRefs = earningIds.map(eid =>
        doc(this.earningsRef, eid)
      )
      const earningSnaps = await Promise.all(
        earningRefs.map(r => tx.get(r))
      )

      const now = Timestamp.now()
      for (let i = 0; i < earningSnaps.length; i++) {
        if (!earningSnaps[i].exists()) continue
        tx.update(earningRefs[i], { status: 'paid', paid_at: now })
      }

      tx.update(ref, {
        status: 'paid' as WithdrawalStatus,
        paid_at: now,
        reviewed_by: adminId,
        reviewed_at: now
      })
    })
  }
}
