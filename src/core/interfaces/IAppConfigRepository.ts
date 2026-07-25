import type { IReferralSettings } from '@/interfaces/IPromotion'

export interface IAppConfigRepository {
  getReferralSettings(): Promise<IReferralSettings | null>
  updateReferralSettings(
    minimum_withdrawal_amount: number,
    updatedBy: string
  ): Promise<void>
}
