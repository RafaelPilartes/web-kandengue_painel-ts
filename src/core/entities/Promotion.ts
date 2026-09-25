/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import { PromotionEntity, PromotionUsageEntity, ReferralEarningEntity, WithdrawalRequestEntity } from '@rafaelpilartes/kandengue-shared/entities'
export { PromotionEntity, PromotionUsageEntity, ReferralEarningEntity, WithdrawalRequestEntity }

import type { FirestoreDataConverter } from 'firebase/firestore'
import type { Promotion } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { CancellationRecord, PromotionUsage } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { ReferralEarning } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { WithdrawalRequest } from '@rafaelpilartes/kandengue-shared/interfaces'
import { toDate } from '@/helpers/firestore'

/**
 * Fronteira única entre o documento `withdrawal_requests` e a aplicação.
 * Datas próprias desta entidade: `created_at`, `reviewed_at`, `paid_at`.
 * (`expires_at` e `updated_at` são do `PromotionUsageEntity` — não se aplicam aqui.)
 */
export const withdrawalRequestConverter: FirestoreDataConverter<WithdrawalRequestEntity> = {
  toFirestore(withdrawal) {
    return { ...withdrawal }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as Record<string, unknown>
    return new WithdrawalRequestEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at as never) ?? new Date(),
      reviewed_at: toDate(d.reviewed_at as never) ?? undefined,
      paid_at: toDate(d.paid_at as never) ?? undefined
    } as WithdrawalRequest)
  }
}

/**
 * Fronteira única entre o documento `referral_earnings` e a aplicação.
 * Datas próprias desta entidade: `created_at`, `requested_at`, `paid_at`.
 */
export const referralEarningConverter: FirestoreDataConverter<ReferralEarningEntity> = {
  toFirestore(earning) {
    return { ...earning }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as Record<string, unknown>
    return new ReferralEarningEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at as never) ?? new Date(),
      requested_at: toDate(d.requested_at as never),
      paid_at: toDate(d.paid_at as never)
    } as ReferralEarning)
  }
}

/**
 * Fronteira única entre o documento `promotions` e a aplicação.
 * Datas próprias: `valid_from`, `valid_until`, `created_at`.
 *
 * O `id` vem de `snapshot.id`. No documento existe também um campo `id`
 * gravado por `create`, com o mesmo valor (o código normalizado) — mas o id
 * do snapshot é a fonte fiável, e é o que os restantes converters usam.
 */
export const promotionConverter: FirestoreDataConverter<PromotionEntity> = {
  toFirestore(promotion) {
    return { ...promotion }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as Record<string, unknown>
    return new PromotionEntity({
      ...d,
      id: snapshot.id,
      valid_from: toDate(d.valid_from as never) ?? new Date(),
      valid_until: toDate(d.valid_until as never) ?? new Date(),
      created_at: toDate(d.created_at as never) ?? new Date()
    } as Promotion)
  }
}

/**
 * Fronteira única entre o documento `promotionUsages` e a aplicação.
 * Além das datas próprias, converte as datas dentro de
 * `cancellation_history`, que o motor não alcança sozinho.
 */
export const promotionUsageConverter: FirestoreDataConverter<PromotionUsageEntity> =
  {
    toFirestore(usage) {
      return { ...usage }
    },
    fromFirestore(snapshot, options) {
      const d = snapshot.data(options) as Record<string, unknown>
      const history = (d.cancellation_history ?? []) as CancellationRecord[]
      return new PromotionUsageEntity({
        ...d,
        id: snapshot.id,
        expires_at: d.expires_at ? toDate(d.expires_at as never) : null,
        created_at: toDate(d.created_at as never) ?? new Date(),
        updated_at: toDate(d.updated_at as never) ?? new Date(),
        cancellation_history: history.map(r => ({
          ...r,
          cancelled_at: toDate(r.cancelled_at as never) ?? new Date()
        }))
      } as PromotionUsage)
    }
  }
