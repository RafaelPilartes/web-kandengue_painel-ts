import { DEFAULT_REGION } from '@rafaelpilartes/kandengue-shared/constants'
import {
  RIDE_TYPES,
  VEHICLE_TYPES,
  type RideType,
  type VehicleType
} from '@rafaelpilartes/kandengue-shared/enums'
import { isValidRideVehiclePair } from '@rafaelpilartes/kandengue-shared/functions'
import type { PricingProfileInterface } from '@rafaelpilartes/kandengue-shared/interfaces'
import type { RegionCode } from '@rafaelpilartes/kandengue-shared/types'

/**
 * A grelha do ecrã de perfis: uma linha por serviço (RideType), uma coluna
 * por veículo (VehicleType). Cada célula diz se a combinação existe na
 * tabela da lib, se há perfil gravado e se está activo — o que está a ser
 * vendido vê-se de uma vez, e uma combinação que não se oferece nunca
 * ganha um botão de criar.
 */
export type PricingMatrixCell = {
  ride_type: RideType
  vehicle_type: VehicleType
  valid: boolean
  profile: PricingProfileInterface | null
  active: boolean
}

export type PricingMatrixRow = {
  ride_type: RideType
  cells: PricingMatrixCell[]
}

export function buildPricingMatrix(
  profiles: PricingProfileInterface[],
  region: RegionCode = DEFAULT_REGION
): PricingMatrixRow[] {
  const inRegion = profiles.filter(p => p.region === region)

  return RIDE_TYPES.map(ride_type => ({
    ride_type,
    cells: VEHICLE_TYPES.map(vehicle_type => {
      const profile =
        inRegion.find(
          p => p.ride_type === ride_type && p.vehicle_type === vehicle_type
        ) ?? null
      return {
        ride_type,
        vehicle_type,
        valid: isValidRideVehiclePair(ride_type, vehicle_type),
        profile,
        active: profile?.active ?? false
      }
    })
  }))
}
