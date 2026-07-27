import {
  collection,
  deleteField,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  setDoc,
  startAfter,
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
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/promotion'

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

  // Para updateDoc(): um valor `undefined` significa "o admin limpou este
  // campo" e deve apagá-lo de facto no Firestore via deleteField() — ao
  // contrário de sanitize(), que apenas omite a chave (e por isso nunca
  // consegue limpar um valor já persistido).
  private sanitizeForUpdate(
    data: Record<string, any>
  ): Record<string, any> {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === undefined ? deleteField() : v])
    )
  }

  async getAll(
    limitValue: number = 100,
    offset = 0,
    _searchTerm?: string,
    filters?: Partial<PromotionEntity>
  ): Promise<ListResponseType<PromotionEntity[]>> {
    let baseQuery = query(this.ref, orderBy('created_at', 'desc'))
    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          baseQuery = query(baseQuery, where(field, '==', value))
        }
      })
    }

    let total = 0
    try {
      const countSnap = await getCountFromServer(baseQuery)
      total = countSnap.data().count
    } catch (err) {
      console.warn('Erro ao obter count de promoções:', err)
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
    const data = snap.docs.map(d => mapPromotion(d.data()))
    return {
      data,
      pagination: { limit: limitValue, offset, count: total }
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
    const patch: Record<string, any> = this.sanitizeForUpdate(promotion)

    // rules é substituído por inteiro (não é merge profundo no Firestore),
    // por isso undefined aqui significa apenas "não enviado" — nunca
    // apagar o campo inteiro.
    delete patch.rules
    if (promotion.rules !== undefined)
      patch.rules = this.sanitize(promotion.rules)

    if (promotion.valid_from)
      patch.valid_from = Timestamp.fromDate(promotion.valid_from)
    if (promotion.valid_until)
      patch.valid_until = Timestamp.fromDate(promotion.valid_until)

    // Nunca permitir mudar o code (é o doc id), os contadores, nem os
    // campos de auditoria de criação — mesmo que o caller os envie.
    delete patch.id
    delete patch.code
    delete patch.used_count_approx
    delete patch.reserved_count_approx
    delete patch.created_by
    delete patch.created_at

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

  async listAllowedUsers(code: string): Promise<AllowedUser[]> {
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
