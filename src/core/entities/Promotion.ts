import type {
  IPromotion,
  IPromotionUsage,
  IReferralEarning,
  IWithdrawalRequest,
  PromotionRules,
  PromotionType,
  PromotionUsageStatus,
  EarningStatus,
  WithdrawalStatus,
  ReferralConfig,
  CancellationRecord
} from '@/interfaces/IPromotion'

export class PromotionEntity implements IPromotion {
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

  constructor(params: IPromotion) {
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

export class PromotionUsageEntity implements IPromotionUsage {
  id: string
  promotion_id: string
  user_id: string
  ride_id: string | null
  status: PromotionUsageStatus
  discount_applied: number
  device_id?: string | null
  grace_cancel_count: number
  driver_cancel_count: number
  cancellation_history: CancellationRecord[]
  expires_at: Date | null
  created_at: Date
  updated_at: Date

  constructor(params: IPromotionUsage) {
    this.id = params.id
    this.promotion_id = params.promotion_id
    this.user_id = params.user_id
    this.ride_id = params.ride_id
    this.status = params.status
    this.discount_applied = params.discount_applied ?? 0
    this.device_id = params.device_id
    this.grace_cancel_count = params.grace_cancel_count ?? 0
    this.driver_cancel_count = params.driver_cancel_count ?? 0
    this.cancellation_history = params.cancellation_history ?? []
    this.expires_at = params.expires_at
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}

export class ReferralEarningEntity implements IReferralEarning {
  id: string
  referrer_user_id: string
  referred_user_id: string
  promotion_id: string
  ride_id: string
  reward_type: 'fixed' | 'percentage'
  reward_value: number
  reward_amount: number
  status: EarningStatus
  requested_at?: Date | null
  paid_at?: Date | null
  created_at: Date

  constructor(params: IReferralEarning) {
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

export class WithdrawalRequestEntity implements IWithdrawalRequest {
  id: string
  user_id: string
  earning_ids: string[]
  total_amount: number
  status: WithdrawalStatus
  payment_details: {
    bank_name: string
    account_number: string
    account_holder: string
  }
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: Date
  paid_at?: Date
  created_at: Date

  constructor(params: IWithdrawalRequest) {
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
