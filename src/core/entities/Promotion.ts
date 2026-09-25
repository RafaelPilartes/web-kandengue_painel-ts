import type { FirestoreDataConverter } from 'firebase/firestore'
import type { Promotion, PromotionRules, ReferralConfig } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { PromotionType, ReferralRewardType } from '@rafaelpilartes/kandengue-shared/types'
import type { CancellationRecord, PromotionUsage } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { PromotionUsageStatus } from '@rafaelpilartes/kandengue-shared/types'
import type { ReferralEarning } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { EarningStatus } from '@rafaelpilartes/kandengue-shared/types'
import type { PaymentDetails, WithdrawalRequest } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/types'
import { toDate } from '@/helpers/firestore'

export class PromotionEntity implements Promotion {
  id: string
  code: string
  type: PromotionType
  value: number
  max_discount?: number
  min_ride_value?: number
  usage_limit_total?: number
  usage_limit_per_user?: number
  used_count_approx: number
  reserved_count_approx: number
  valid_from: Date
  valid_until: Date
  active: boolean
  rules: PromotionRules
  referral?: ReferralConfig
  created_by: string
  created_at: Date

  constructor(params: Promotion) {
    this.id = params.id
    this.code = params.code
    this.type = params.type
    this.value = params.value
    this.max_discount = params.max_discount
    this.min_ride_value = params.min_ride_value
    this.usage_limit_total = params.usage_limit_total
    this.usage_limit_per_user = params.usage_limit_per_user
    this.used_count_approx = params.used_count_approx ?? 0
    this.reserved_count_approx = params.reserved_count_approx ?? 0
    this.valid_from = params.valid_from
    this.valid_until = params.valid_until
    this.active = params.active
    this.rules = params.rules ?? {}
    this.referral = params.referral
    this.created_by = params.created_by
    this.created_at = params.created_at
  }
}

export class PromotionUsageEntity implements PromotionUsage {
  id: string
  promotion_id: string
  user_id: string
  ride_id: string | null
  status: PromotionUsageStatus
  discount_applied: number
  device_id?: string | null
  grace_cancel_count: number
  driver_cancel_counts: Record<string, number>
  cancellation_history: CancellationRecord[]
  expires_at: Date | null
  created_at: Date
  updated_at: Date

  constructor(params: PromotionUsage) {
    this.id = params.id
    this.promotion_id = params.promotion_id
    this.user_id = params.user_id
    this.ride_id = params.ride_id
    this.status = params.status
    this.discount_applied = params.discount_applied ?? 0
    this.device_id = params.device_id
    this.grace_cancel_count = params.grace_cancel_count ?? 0
    this.driver_cancel_counts = params.driver_cancel_counts ?? {}
    this.cancellation_history = params.cancellation_history ?? []
    this.expires_at = params.expires_at
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}

export class ReferralEarningEntity implements ReferralEarning {
  id: string
  referrer_user_id: string
  referred_user_id: string
  promotion_id: string
  ride_id: string
  reward_type: ReferralRewardType
  reward_value: number
  reward_amount: number
  status: EarningStatus
  requested_at?: Date | null
  paid_at?: Date | null
  created_at: Date

  constructor(params: ReferralEarning) {
    this.id = params.id
    this.referrer_user_id = params.referrer_user_id
    this.referred_user_id = params.referred_user_id
    this.promotion_id = params.promotion_id
    this.ride_id = params.ride_id
    this.reward_type = params.reward_type
    this.reward_value = params.reward_value
    this.reward_amount = params.reward_amount
    this.status = params.status
    this.requested_at = params.requested_at
    this.paid_at = params.paid_at
    this.created_at = params.created_at
  }
}

export class WithdrawalRequestEntity implements WithdrawalRequest {
  id: string
  user_id: string
  earning_ids: string[]
  total_amount: number
  status: WithdrawalStatus
  payment_details: PaymentDetails
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: Date
  paid_at?: Date
  created_at: Date

  constructor(params: WithdrawalRequest) {
    this.id = params.id
    this.user_id = params.user_id
    this.earning_ids = params.earning_ids ?? []
    this.total_amount = params.total_amount
    this.status = params.status
    this.payment_details = params.payment_details
    this.admin_notes = params.admin_notes
    this.reviewed_by = params.reviewed_by
    this.reviewed_at = params.reviewed_at
    this.paid_at = params.paid_at
    this.created_at = params.created_at
  }
}

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
