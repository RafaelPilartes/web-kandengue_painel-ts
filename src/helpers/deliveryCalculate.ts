import type { RideRatesInterface } from '@/interfaces/IRideRates'
import { isWithinTimeRange, timeToMinutes } from './deliveryTime'

export function calculateFare(
  distanceKm: number,
  waitMinutes: number,
  deliveryRates: RideRatesInterface
) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const dayStart = timeToMinutes(deliveryRates.day_rates.start_time)
  const dayEnd = timeToMinutes(deliveryRates.day_rates.end_time)

  const nightStart = timeToMinutes(deliveryRates.night_rates.start_time)
  const nightEnd = timeToMinutes(deliveryRates.night_rates.end_time)

  // Selecionar tarifa
  // let rate = deliveryRates.nightRates;

  let rate
  if (isWithinTimeRange(currentMinutes, dayStart, dayEnd)) {
    rate = deliveryRates.day_rates
  } else if (isWithinTimeRange(currentMinutes, nightStart, nightEnd)) {
    rate = deliveryRates.night_rates
  } else {
    // Caso fora do horário definido (ex: madrugada) — fallback para nightRates
    rate = deliveryRates.night_rates
  }

  // Calcular custos
  const extraWaitMinutes = Math.max(
    0,
    waitMinutes - rate.wait_time_free_minutes
  )
  const distanceCost = distanceKm * rate.price_per_km
  const waitCost = extraWaitMinutes * rate.price_per_minute

  const subtotal = rate.base_fare + distanceCost + waitCost
  const insuranceFee = (subtotal * deliveryRates.insurance_percent) / 100
  const finalTotal = subtotal + insuranceFee

  // Garantir arredondamento em valores monetários
  const round = (val: number) => Math.round(val)

  return {
    total: round(finalTotal),
    breakdown: {
      baseFare: round(rate.base_fare),
      distanceCost: round(distanceCost),
      waitCost: round(waitCost),
      insuranceFee: round(insuranceFee)
    },
    payouts: {
      driverEarnings: round(
        (finalTotal * deliveryRates.payouts.driver_percent) / 100
      ),
      companyEarnings: round(
        (finalTotal * deliveryRates.payouts.company_percent) / 100
      ),
      pensionFund: round(
        (finalTotal * deliveryRates.payouts.pension_fund_percent) / 100
      )
    }
  }
}
