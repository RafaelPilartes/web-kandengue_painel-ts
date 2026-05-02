export type GeoLocationType = {
  description: string
  place_id: string
  name?: string
  latitude: number
  longitude: number
}

export type LocationType = {
  latitude: number
  longitude: number
  heading?: number
  speed?: number
  accuracy?: number
  updated_at?: Date
}
