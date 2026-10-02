import { describe, expect, it } from 'vitest'
import {
  closedFareV2,
  fareDistance,
  needsFareReview,
  signedDeviationPercent
} from '@/helpers/fareReview'
import type { RideEntity } from '@/core/entities/Ride'

const distance = {
  used_km: 8.4,
  source: 'tracked' as const,
  estimated_km: 4.2,
  tracked_km: 8.4,
  deviation_percent: 100,
  review_required: true
}

const fareV2 = {
  total: 4323,
  breakdown: {
    base_fare: 750,
    distance_cost: 1680,
    wait_cost: 0,
    subtotal: 2430,
    insurance_fee: 122,
    gross_amount: 2552
  },
  payouts: { driver_earnings: 1944, company_earnings: 364, pension_fund: 122 },
  distance
}

/** A V1 que as corridas anteriores ao motor de preços trazem do telefone. */
const fareV1 = {
  total: 3000,
  breakdown: {
    base_fare: 750,
    distance_cost: 2000,
    wait_cost: 0,
    insurance_fee: 150
  },
  payouts: { driver_earnings: 2400, company_earnings: 450, pension_fund: 150 }
}

const ride = (fare?: unknown) => ({ fare }) as Pick<RideEntity, 'fare'>

describe('closedFareV2', () => {
  it('devolve a tarifa quando é V2 fechada pelo servidor', () => {
    expect(closedFareV2(ride(fareV2))?.distance?.used_km).toBe(8.4)
  })

  it('devolve null para uma corrida sem tarifa', () => {
    expect(closedFareV2(ride(undefined))).toBeNull()
  })

  /*
   * O caso que importa: em produção coexistem as duas formas. Uma V1 não tem
   * `distance`, logo não pode estar em revisão — e tratá-la como V2 daria
   * `undefined` a atravessar o ecrã.
   */
  it('devolve null para uma tarifa V1, que não tem distance', () => {
    expect(closedFareV2(ride(fareV1))).toBeNull()
  })
})

describe('needsFareReview', () => {
  it('é verdade só quando o servidor marcou', () => {
    expect(needsFareReview(ride(fareV2))).toBe(true)
    expect(
      needsFareReview(
        ride({ ...fareV2, distance: { ...distance, review_required: false } })
      )
    ).toBe(false)
  })

  it('uma corrida sem tarifa ou com V1 nunca precisa de revisão', () => {
    expect(needsFareReview(ride(undefined))).toBe(false)
    expect(needsFareReview(ride(fareV1))).toBe(false)
  })
})

describe('fareDistance', () => {
  it('devolve o bloco da distância, ou null', () => {
    expect(fareDistance(ride(fareV2))).toEqual(distance)
    expect(fareDistance(ride(fareV1))).toBeNull()
  })
})

describe('signedDeviationPercent', () => {
  /*
   * O `deviation_percent` gravado é absoluto. Para quem revê, saber se se
   * cobrou a mais ou a menos é metade da informação — e era o que faltava.
   */
  it('é positivo quando se cobrou mais do que o estimado', () => {
    expect(signedDeviationPercent(distance)).toBe(100)
  })

  it('é negativo quando se cobrou menos', () => {
    expect(
      signedDeviationPercent({ ...distance, used_km: 2.1, tracked_km: 2.1 })
    ).toBe(-50)
  })

  it('é zero quando bate certo', () => {
    expect(
      signedDeviationPercent({ ...distance, used_km: 4.2, tracked_km: 4.2 })
    ).toBe(0)
  })

  it('arredonda a uma décima, como o resto do motor', () => {
    expect(
      signedDeviationPercent({ ...distance, used_km: 4.5, tracked_km: 4.5 })
    ).toBe(7.1)
  })

  it('devolve null quando a estimada é zero — não divide por zero', () => {
    expect(signedDeviationPercent({ ...distance, estimated_km: 0 })).toBeNull()
  })
})
