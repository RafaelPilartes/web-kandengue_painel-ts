// Replicação manual — fonte de verdade: documento "08 — Firestore Schema".

export type PromotionType = 'percentage' | 'fixed' | 'free_ride'

export type PromotionUsageStatus =
  | 'reserved'
  | 'used'
  | 'cancelled'
  | 'expired'

export type EarningStatus = 'pending' | 'requested' | 'paid' | 'cancelled'

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export type RideKind = 'car' | 'motorcycle' | 'bicycle' | 'delivery'

export type RidePaymentMethod = 'cash' | 'card' | 'wallet'

export interface AllowedCities {
  origin: string[]
  destination: string[]
  match: 'both' | 'any'
}

export interface PromotionRules {
  new_users_only?: boolean
  inactive_days?: number
  has_specific_users?: boolean
  allowed_cities?: AllowedCities
  ride_types?: RideKind[]
  payment_methods?: RidePaymentMethod[]
}

export interface ReferralConfig {
  enabled: boolean
  owner_user_id: string
  reward_type: 'fixed' | 'percentage'
  reward_value: number
}

export interface IPromotion {
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
}

export interface CancellationRecord {
  cancelled_by: 'driver' | 'user' | 'system'
  ride_id: string
  within_grace_period: boolean
  cancelled_at: Date
}

export interface IPromotionUsage {
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
}

export interface IReferralEarning {
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
}

export interface IWithdrawalRequest {
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
}

export interface IReferralSettings {
  minimum_withdrawal_amount: number
  updated_by: string
  updated_at: Date
}

export interface IAllowedUser {
  user_id: string
  added_at: Date
  added_by: string
}
