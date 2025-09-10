export type BreakdownType = {
  base_fare: number
  distance_cost: number
  wait_cost: number
  insurance_fee: number
  discount?: number
}

export type PayoutsType = {
  driver_earnings: number
  company_earnings: number
  pension_fund: number
}

export interface RideFareInterface {
  total: number
  breakdown: BreakdownType
  payouts: PayoutsType
}
