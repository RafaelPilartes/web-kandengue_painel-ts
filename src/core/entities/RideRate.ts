// core/entities/RideRate.ts
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { RateType, PayoutsType } from '@/types/ride'

export class RideRateEntity implements RideRatesInterface {
  id: string
  day_rates: RateType
  night_rates: RateType
  insurance_percent: number
  payouts: PayoutsType

  updated_at?: Date

  constructor(params: RideRatesInterface) {
    this.id = params.id
    this.day_rates = params.day_rates
    this.night_rates = params.night_rates
    this.insurance_percent = params.insurance_percent
    this.payouts = params.payouts

    this.updated_at = params.updated_at
  }
}
