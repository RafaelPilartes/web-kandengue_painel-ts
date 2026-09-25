// modules/Api/firebase/promotion.dao.ts
//
// Assenta no motor para a leitura (getAll/getById/count/getAllByField e os
// listeners), e sobrepõe-lhe `create` e `update`, que esta colecção não pode
// herdar:
//
// - o id do documento é o código normalizado, não um id gerado;
// - `create` tem de inicializar os 10 shards de contagem no mesmo batch do
//   documento principal, ou a CAMADA 1 do `apply` fica sem contadores;
// - `update` tem de apagar campos de facto quando o admin os limpa, e tem de
//   recusar alterações ao código, aos contadores e à auditoria de criação.
//
// Não se declara `searchField`. A página de promoções filtra por *substring*
// no cliente (`p.code.includes(t)`) e passa `searchTerm: undefined` de
// propósito — a pesquisa por prefixo do motor é outra semântica, e ligá-la
// aqui mudaria o que o admin vê.
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
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
  PromotionUsageEntity,
  promotionConverter,
  promotionUsageConverter
} from '@/core/entities/Promotion'
import type { IPromotionRepository } from '@/core/interfaces/IPromotionRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { toDate } from '@/helpers/firestore'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/interfaces'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

const NUM_SHARDS = 10

/** Limite de operações por batch no Firestore é 500; deixa-se folga. */
const BATCH_CHUNK = 450

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export class FirebasePromotionDAO
  extends BaseFirebaseDAO<PromotionEntity>
  implements IPromotionRepository
{
  private readonly usagesRef = collection(
    db,
    firebaseCollections.promotionUsages.root
  )

  constructor() {
    super(firebaseCollections.promotions.root, promotionConverter, 'promo')
  }

  /** Omite as chaves com valor `undefined` — nunca apaga o que já lá está. */
  private sanitize<T extends Record<string, unknown>>(data: T): T {
    return Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    ) as T
  }

  // Para updateDoc(): um valor `undefined` significa "o admin limpou este
  // campo" e deve apagá-lo de facto via deleteField() — ao contrário de
  // sanitize(), que apenas omite a chave (e por isso nunca consegue limpar
  // um valor já persistido).
  // `any` no valor, e não `unknown`: o retorno vai directo a `updateDoc`,
  // cuja assinatura exige `FieldValue | Partial<T>` — `unknown` não é
  // atribuível, e é este o tipo que o DAO anterior já usava aqui.
  private sanitizeForUpdate(
    data: Record<string, any>
  ): Record<string, any> {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [
        k,
        v === undefined ? deleteField() : v
      ])
    )
  }

  /** Atalho de leitura — o código normalizado é o id do documento. */
  async getByCode(code: string): Promise<PromotionEntity | null> {
    return this.getById(normalizeCode(code))
  }

  async create(
    promotion: Omit<PromotionEntity, 'id'>
  ): Promise<PromotionEntity> {
    try {
      const code = normalizeCode(promotion.code)

      // Garante atomicidade entre o doc principal e a inicialização dos
      // shards. É por isto que este create não pode ser o do motor.
      const batch = writeBatch(db)
      const promoRef = doc(this.ref, code)

      batch.set(promoRef, {
        ...this.sanitize(promotion as unknown as Record<string, unknown>),
        rules: this.sanitize(
          (promotion.rules ?? {}) as unknown as Record<string, unknown>
        ),
        id: code,
        code,
        used_count_approx: 0,
        reserved_count_approx: 0,
        valid_from: Timestamp.fromDate(promotion.valid_from),
        valid_until: Timestamp.fromDate(promotion.valid_until),
        created_at: Timestamp.now()
      })

      const countersRef = collection(promoRef, 'counters')
      for (let i = 0; i < NUM_SHARDS; i++) {
        batch.set(doc(countersRef, `shard_${i}`), {
          used_count: 0,
          reserved_count: 0
        })
      }

      await batch.commit()

      // Read-back, como no motor: devolve o que ficou gravado, não uma
      // reconstrução optimista.
      const created = await this.getById(code)
      if (!created) {
        return this.fail(
          'create',
          new Error('promoção não encontrada após criação')
        )
      }
      return created
    } catch (err) {
      return this.fail('create', err)
    }
  }

  async update(
    code: string,
    promotion: Partial<PromotionEntity>
  ): Promise<PromotionEntity> {
    try {
      const id = normalizeCode(code)
      const patch = this.sanitizeForUpdate(
        promotion as unknown as Record<string, any>
      )

      // rules é substituído por inteiro (não é merge profundo no Firestore),
      // por isso undefined aqui significa apenas "não enviado" — nunca
      // apagar o campo inteiro.
      delete patch.rules
      if (promotion.rules !== undefined) {
        patch.rules = this.sanitize(
          promotion.rules as unknown as Record<string, unknown>
        )
      }

      if (promotion.valid_from) {
        patch.valid_from = Timestamp.fromDate(promotion.valid_from)
      }
      if (promotion.valid_until) {
        patch.valid_until = Timestamp.fromDate(promotion.valid_until)
      }

      // Nunca permitir mudar o code (é o doc id), os contadores, nem os
      // campos de auditoria de criação — mesmo que o caller os envie.
      delete patch.id
      delete patch.code
      delete patch.used_count_approx
      delete patch.reserved_count_approx
      delete patch.created_by
      delete patch.created_at

      await updateDoc(doc(this.ref, id), patch)

      const updated = await this.getById(id)
      if (!updated) {
        return this.fail(
          'update',
          new Error('promoção não encontrada após update')
        )
      }
      return updated
    } catch (err) {
      return this.fail('update', err)
    }
  }

  async setActive(code: string, active: boolean): Promise<void> {
    try {
      await updateDoc(doc(this.ref, normalizeCode(code)), { active })
    } catch (err) {
      this.fail('setActive', err)
    }
  }

  // ─────────────── Allowed users ───────────────

  async addAllowedUser(
    code: string,
    userId: string,
    addedBy: string
  ): Promise<void> {
    try {
      await setDoc(
        doc(this.ref, normalizeCode(code), 'allowed_users', userId),
        { user_id: userId, added_at: Timestamp.now(), added_by: addedBy }
      )
    } catch (err) {
      this.fail('addAllowedUser', err)
    }
  }

  async addAllowedUsersBulk(
    code: string,
    userIds: string[],
    addedBy: string
  ): Promise<void> {
    if (userIds.length === 0) return
    try {
      const id = normalizeCode(code)
      for (let i = 0; i < userIds.length; i += BATCH_CHUNK) {
        const batch = writeBatch(db)
        for (const uid of userIds.slice(i, i + BATCH_CHUNK)) {
          batch.set(doc(this.ref, id, 'allowed_users', uid), {
            user_id: uid,
            added_at: Timestamp.now(),
            added_by: addedBy
          })
        }
        await batch.commit()
      }
    } catch (err) {
      this.fail('addAllowedUsersBulk', err)
    }
  }

  async removeAllowedUser(code: string, userId: string): Promise<void> {
    try {
      await deleteDoc(
        doc(this.ref, normalizeCode(code), 'allowed_users', userId)
      )
    } catch (err) {
      this.fail('removeAllowedUser', err)
    }
  }

  async listAllowedUsers(code: string): Promise<AllowedUser[]> {
    try {
      const snap = await getDocs(
        collection(this.ref, normalizeCode(code), 'allowed_users')
      )
      return snap.docs.map(d => {
        const data = d.data()
        return {
          user_id: data.user_id ?? d.id,
          added_at: toDate(data.added_at) ?? new Date(),
          added_by: data.added_by ?? 'unknown'
        }
      })
    } catch (err) {
      return this.fail('listAllowedUsers', err)
    }
  }

  // ─────────────── Usages ───────────────

  async listUsages(
    code: string,
    limitValue = 100
  ): Promise<PromotionUsageEntity[]> {
    try {
      const snap = await getDocs(
        query(
          this.usagesRef,
          where('promotion_id', '==', normalizeCode(code)),
          orderBy('created_at', 'desc'),
          fbLimit(limitValue)
        )
      )
      return snap.docs.map(d => promotionUsageConverter.fromFirestore(d, {}))
    } catch (err) {
      return this.fail('listUsages', err)
    }
  }
}
