export type BreakdownType = {
  base_fare: number // Preço base
  distance_cost: number // Custo total pela distância
  wait_cost: number // Custo total pela espera
  insurance_fee: number // Taxa de seguro
  discount?: number // Desconto
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
