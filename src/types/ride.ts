export type RideDetailsType = {
  receiver: {
    name: string
    phone: string
  }
  item: {
    type: string
    description: string
    quantity: number
    size: 'small' | 'medium' | 'large'
    weight?: number // opcional (kg)
  }
}

export type RateType = {
  start_time: string
  end_time: string
  base_fare: number
  price_per_km: number
  wait_time_free_minutes: number
  price_per_minute: number
}

export type PayoutsType = {
  driver_percent: number
  company_percent: number
  pension_fund_percent: number
}

export type LiveLocationType = {
  latitude: number
  longitude: number
  timestamp: Date
}
