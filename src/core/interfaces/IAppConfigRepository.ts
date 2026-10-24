import type { IReferralSettings } from '@/interfaces/IPromotion'

/**
 * `app_config/regions` — the region check's switch.
 *
 * ⚠️ **`exists` is not decoration.** An absent document means the check is
 * **on**, which is the API's own rule (`enforcement_enabled !== false`, and a
 * missing document or a failed read both stay on). Without `exists` the screen
 * could not tell "nobody ever wrote this" from "somebody turned it on", and
 * those two deserve different words.
 */
export interface IRegionsSettings {
  enforcement_enabled: boolean
  exists: boolean
  updated_by?: string
  updated_at?: Date
}

export interface IAppConfigRepository {
  getReferralSettings(): Promise<IReferralSettings | null>
  updateReferralSettings(
    minimum_withdrawal_amount: number,
    updatedBy: string
  ): Promise<void>

  /** The region check's switch, with the API's default when absent. */
  getRegionsSettings(): Promise<IRegionsSettings>
  /**
   * Turns the region check on or off.
   *
   * ⚠️ **Written straight to Firestore, not through the API** — and that is
   * the point. This is the brake for when the check itself is refusing rides
   * it should not, so it must not depend on the service it brakes. The API
   * picks the change up when its 5-minute cache expires.
   */
  updateRegionsEnforcement(enabled: boolean, updatedBy: string): Promise<void>
}
