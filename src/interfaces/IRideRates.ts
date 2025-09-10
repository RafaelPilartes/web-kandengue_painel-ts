import type { RateType, PayoutsType } from '@/types/ride'

// Tipo principal
export interface RideRatesInterface {
  id: string
  day_rates: RateType
  night_rates: RateType
  insurance_percent: number
  payouts: PayoutsType
  updated_at?: Date
}
