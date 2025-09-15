import type { RideRatesInterface } from '@/interfaces/IRideRates'

export const defaultRates: RideRatesInterface = {
  id: 'default',
  day_rates: {
    start_time: '00:00',
    end_time: '00:00',
    base_fare: 0,
    price_per_km: 0,
    wait_time_free_minutes: 0,
    price_per_minute: 0
  },
  night_rates: {
    start_time: '00:00',
    end_time: '00:00',
    base_fare: 0,
    price_per_km: 0,
    wait_time_free_minutes: 0,
    price_per_minute: 0
  },
  insurance_percent: 0,
  payouts: {
    driver_percent: 0,
    company_percent: 0,
    pension_fund_percent: 0
  },
  updated_at: new Date()
}
