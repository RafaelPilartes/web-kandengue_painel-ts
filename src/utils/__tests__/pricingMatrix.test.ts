import { describe, expect, it } from 'vitest'
import type { PricingProfileInterface } from '@rafaelpilartes/kandengue-shared/interfaces'
import { buildPricingMatrix } from '@/utils/pricingMatrix'

// A grelha do ecrã de perfis: uma linha por serviço, uma coluna por veículo.
// Cada célula diz se a combinação existe (tabela da lib), se há perfil e se
// está activo — para o admin ver de uma vez o que está a ser vendido.

const profile = (over: Partial<PricingProfileInterface>): PricingProfileInterface => ({
  id: 'AO-LUA_delivery_motorcycle',
  region: 'AO-LUA',
  ride_type: 'delivery',
  vehicle_type: 'motorcycle',
  rate_bands: [],
  min_fare: 0,
  insurance_percent: 5,
  payouts: { driver_percent: 80, company_percent: 15, pension_fund_percent: 5 },
  max_surcharge_percent: 100,
  utc_offset_minutes: 60,
  active: true,
  version: 1,
  ...over
})

describe('buildPricingMatrix', () => {
  it('tem uma linha por tipo de corrida e uma coluna por veículo, na ordem dos enums', () => {
    const matrix = buildPricingMatrix([])
    expect(matrix.map(row => row.ride_type)).toEqual(['delivery', 'moto_taxi', 'car'])
    expect(matrix[0].cells.map(c => c.vehicle_type)).toEqual(['motorcycle', 'car'])
  })

  it('marca as combinações que não existem como não oferecidas', () => {
    const matrix = buildPricingMatrix([])
    const motoTaxiCar = matrix[1].cells[1]
    const carMotorcycle = matrix[2].cells[0]
    expect(motoTaxiCar).toMatchObject({ ride_type: 'moto_taxi', vehicle_type: 'car', valid: false, profile: null })
    expect(carMotorcycle).toMatchObject({ valid: false, profile: null })
  })

  it('liga cada perfil à sua célula e diz se está activo', () => {
    const matrix = buildPricingMatrix([
      profile({}),
      profile({ id: 'AO-LUA_delivery_car', vehicle_type: 'car', active: false })
    ])
    const deliveryRow = matrix[0]
    expect(deliveryRow.cells[0]).toMatchObject({ valid: true, active: true })
    expect(deliveryRow.cells[0].profile?.id).toBe('AO-LUA_delivery_motorcycle')
    expect(deliveryRow.cells[1]).toMatchObject({ valid: true, active: false })
    expect(deliveryRow.cells[1].profile?.id).toBe('AO-LUA_delivery_car')
  })

  it('uma combinação válida sem perfil fica por criar', () => {
    const matrix = buildPricingMatrix([profile({})])
    expect(matrix[1].cells[0]).toMatchObject({ ride_type: 'moto_taxi', vehicle_type: 'motorcycle', valid: true, profile: null, active: false })
  })

  it('só conta os perfis da região pedida', () => {
    const matrix = buildPricingMatrix([profile({ id: 'AO-BGU_delivery_motorcycle', region: 'AO-BGU' })], 'AO-LUA')
    expect(matrix[0].cells[0].profile).toBeNull()
  })
})
