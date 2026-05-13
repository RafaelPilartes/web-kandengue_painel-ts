import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/config/firebase.config'
import {
  PromotionEntity,
  PromotionUsageEntity
} from '@/core/entities/Promotion'
import type { IPromotionRepository } from '@/core/interfaces/IPromotionRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { IAllowedUser } from '@/interfaces/IPromotion'

const NUM_SHARDS = 10

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

function toDate(v: any): Date {
  if (!v) return new Date()
  if (v instanceof Date) return v
  if (typeof v?.toDate === 'function') return v.toDate()
  return new Date(v)
}

function mapPromotion(data: any): PromotionEntity {
  return new PromotionEntity({
    ...data,
    valid_from: toDate(data.valid_from),
    valid_until: toDate(data.valid_until),
    created_at: toDate(data.created_at)
  })
}

function mapUsage(id: string, data: any): PromotionUsageEntity {
  return new PromotionUsageEntity({
    ...data,
    id,
    expires_at: data.expires_at ? toDate(data.expires_at) : null,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
    cancellation_history: (data.cancellation_history ?? []).map((r: any) => ({
      ...r,
      cancelled_at: toDate(r.cancelled_at)
    }))
  })
}

export class FirebasePromotionDAO implements IPromotionRepository {
  private ref = collection(db, firebaseCollections.promotions.root)
  private usagesRef = collection(db, firebaseCollections.promotionUsages.root)

  private sanitize<T extends Record<string, any>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    ) as T
  }

  async getAll(
    limitValue: number = 100,
    _offset = 0,
    _searchTerm?: string,
    filters?: Partial<PromotionEntity>
  ): Promise<ListResponseType<PromotionEntity[]>> {
    let q = query(this.ref, orderBy('created_at', 'desc'))
    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          q = query(q, where(field, '==', value))
        }
      })
    }
    q = query(q, fbLimit(limitValue))
    const snap = await getDocs(q)
    const data = snap.docs.map(d => mapPromotion(d.data()))
    return {
      data,
      pagination: { limit: limitValue, offset: 0, count: data.length }
    }
  }

  async getByCode(code: string): Promise<PromotionEntity | null> {
    const id = normalizeCode(code)
    const snap = await getDoc(doc(this.ref, id))
    if (!snap.exists()) return null
    return mapPromotion(snap.data())
  }

  async create(
    promotion: Omit<PromotionEntity, 'id'>
  ): Promise<PromotionEntity> {
    const code = normalizeCode(promotion.code)

    // Garante atomicidade entre o doc principal e a inicialização dos shards.
    const batch = writeBatch(db)
    const promoRef = doc(this.ref, code)

    const payload = {
      ...this.sanitize(promotion as Record<string, any>),
      rules: this.sanitize(promotion.rules ?? {}),
      id: code,
      code,
      used_count_approx: 0,
      reserved_count_approx: 0,
      valid_from: Timestamp.fromDate(promotion.valid_from),
      valid_until: Timestamp.fromDate(promotion.valid_until),
      created_at: Timestamp.now()
    }
    batch.set(promoRef, payload)

    // Inicializa todos os shards com zeros.
    const countersRef = collection(promoRef, 'counters')
    for (let i = 0; i < NUM_SHARDS; i++) {
      batch.set(doc(countersRef, `shard_${i}`), {
        used_count: 0,
        reserved_count: 0
      })
    }

    await batch.commit()

    return mapPromotion(payload)
  }

  async update(
    code: string,
    promotion: Partial<PromotionEntity>
  ): Promise<PromotionEntity> {
    const id = normalizeCode(code)
    const patch: Record<string, any> = { ...this.sanitize(promotion) }
    if (promotion.rules !== undefined)
      patch.rules = this.sanitize(promotion.rules)
    if (promotion.valid_from)
      patch.valid_from = Timestamp.fromDate(promotion.valid_from)
    if (promotion.valid_until)
      patch.valid_until = Timestamp.fromDate(promotion.valid_until)
    // Nunca permitir mudar o code (é o doc id)
    delete patch.id
    delete patch.code
    delete patch.used_count_approx
    delete patch.reserved_count_approx

    await updateDoc(doc(this.ref, id), patch)
    const updated = await this.getByCode(id)
    if (!updated) throw new Error('Promotion not found after update')
    return updated
  }

  async setActive(code: string, active: boolean): Promise<void> {
    await updateDoc(doc(this.ref, normalizeCode(code)), { active })
  }

  // ─────────────── Allowed users ───────────────

  async addAllowedUser(
    code: string,
    userId: string,
    addedBy: string
  ): Promise<void> {
    const id = normalizeCode(code)
    await setDoc(
      doc(this.ref, id, 'allowed_users', userId),
      {
        user_id: userId,
        added_at: Timestamp.now(),
        added_by: addedBy
      }
    )
  }

  async addAllowedUsersBulk(
    code: string,
    userIds: string[],
    addedBy: string
  ): Promise<void> {
    if (userIds.length === 0) return
    const id = normalizeCode(code)
    // Firestore batch limit = 500 ops; usar chunks.
    const CHUNK = 450
    for (let i = 0; i < userIds.length; i += CHUNK) {
      const slice = userIds.slice(i, i + CHUNK)
      const batch = writeBatch(db)
      for (const uid of slice) {
        batch.set(doc(this.ref, id, 'allowed_users', uid), {
          user_id: uid,
          added_at: Timestamp.now(),
          added_by: addedBy
        })
      }
      await batch.commit()
    }
  }

  async removeAllowedUser(code: string, userId: string): Promise<void> {
    const id = normalizeCode(code)
    const ref = doc(this.ref, id, 'allowed_users', userId)
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(ref)
  }

  async listAllowedUsers(code: string): Promise<IAllowedUser[]> {
    const id = normalizeCode(code)
    const snap = await getDocs(collection(this.ref, id, 'allowed_users'))
    return snap.docs.map(d => {
      const data = d.data()
      return {
        user_id: data.user_id ?? d.id,
        added_at: toDate(data.added_at),
        added_by: data.added_by ?? 'unknown'
      }
    })
  }

  // ─────────────── Usages ───────────────

  async listUsages(
    code: string,
    limitValue = 100
  ): Promise<PromotionUsageEntity[]> {
    const id = normalizeCode(code)
    const q = query(
      this.usagesRef,
      where('promotion_id', '==', id),
      orderBy('created_at', 'desc'),
      fbLimit(limitValue)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => mapUsage(d.id, d.data()))
  }
}
