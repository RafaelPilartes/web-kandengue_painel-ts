import { describe, expect, it } from 'vitest'
import type {
  AdminRegion,
  PricingProfileView
} from '@/core/interfaces/IPricingRepository'
import {
  PRICING_SERVICES,
  buildRegionSummaries,
  buildServiceComparison,
  groupRegionSummaries,
  orphanProfiles,
  serviceKey,
  summariseAll
} from '@/utils/pricingByRegion'

/**
 * The counting behind the prices page: 21 provinces × 4 services is wrong in
 * ways nobody spots on screen, so it is proved here instead.
 *
 * The three regions mirror production as of 2026-10-24: Luanda and Icolo e
 * Bengo share the `grande-luanda` operating area because the airport sits in
 * the second one; Benguela stands alone with no group.
 */
const LUANDA: AdminRegion = {
  code: 'AO-LUA',
  name: 'Luanda',
  group: 'grande-luanda',
  provisional: false,
  alias_count: 2
}

const ICOLO: AdminRegion = {
  code: 'AO-ICB',
  name: 'Icolo e Bengo',
  group: 'grande-luanda',
  provisional: true,
  alias_count: 3
}

const BENGUELA: AdminRegion = {
  code: 'AO-BGU',
  name: 'Benguela',
  group: null,
  provisional: false,
  alias_count: 1
}

function profile(
  overrides: Partial<PricingProfileView> & { region: string }
): PricingProfileView {
  return {
    id: `${overrides.region}_${overrides.ride_type ?? 'delivery'}_${overrides.vehicle_type ?? 'motorcycle'}`,
    ride_type: 'delivery',
    vehicle_type: 'motorcycle',
    rate_bands: [],
    min_fare: 0,
    insurance_percent: 5,
    payouts: {
      driver_percent: 80,
      company_percent: 15,
      pension_fund_percent: 5
    },
    max_surcharge_percent: 100,
    utc_offset_minutes: 60,
    active: false,
    version: 1,
    ...overrides
  } as PricingProfileView
}

describe('PRICING_SERVICES', () => {
  it('derives the four pairs the lib allows, not a hand-written list', () => {
    expect(PRICING_SERVICES.map(serviceKey).sort()).toEqual([
      'car:car',
      'delivery:car',
      'delivery:motorcycle',
      'moto_taxi:motorcycle'
    ])
  })
})

describe('buildRegionSummaries', () => {
  it('gives every province a row, including one with no profile at all', () => {
    const summaries = buildRegionSummaries([LUANDA, BENGUELA], [])

    expect(summaries.map(s => s.region.code)).toEqual(['AO-LUA', 'AO-BGU'])
    expect(summaries[0].cells).toHaveLength(PRICING_SERVICES.length)
    expect(summaries[0].activeCount).toBe(0)
    expect(summaries[0].missingCount).toBe(PRICING_SERVICES.length)
  })

  it('counts active and pending-review services per province', () => {
    const summaries = buildRegionSummaries(
      [LUANDA, ICOLO, BENGUELA],
      [
        profile({ region: 'AO-LUA', active: true }),
        profile({
          region: 'AO-LUA',
          ride_type: 'moto_taxi',
          vehicle_type: 'motorcycle',
          active: true
        }),
        // Icolo e Bengo is born active *and* marked: it mirrors Luanda.
        profile({
          region: 'AO-ICB',
          active: true,
          prices_need_review: true
        }),
        profile({
          region: 'AO-ICB',
          ride_type: 'car',
          vehicle_type: 'car',
          active: false,
          prices_need_review: true
        }),
        profile({
          region: 'AO-BGU',
          active: false,
          prices_need_review: true
        })
      ]
    )

    const [luanda, icolo, benguela] = summaries

    expect(luanda.activeCount).toBe(2)
    expect(luanda.needsReviewCount).toBe(0)

    expect(icolo.activeCount).toBe(1)
    expect(icolo.needsReviewCount).toBe(2)
    expect(icolo.missingCount).toBe(2)

    expect(benguela.activeCount).toBe(0)
    expect(benguela.needsReviewCount).toBe(1)
  })

  it('treats a missing prices_need_review as reviewed, never as pending', () => {
    const summaries = buildRegionSummaries(
      [LUANDA],
      [profile({ region: 'AO-LUA', active: true })]
    )

    expect(summaries[0].needsReviewCount).toBe(0)
    expect(summaries[0].cells.some(c => c.needsReview)).toBe(false)
  })

  it('never lets one province see another province profiles', () => {
    const summaries = buildRegionSummaries(
      [LUANDA, BENGUELA],
      [profile({ region: 'AO-LUA', active: true })]
    )

    expect(summaries[1].cells.every(c => c.profile === null)).toBe(true)
  })
})

describe('groupRegionSummaries', () => {
  it('collapses the provinces that share an operating area', () => {
    const groups = groupRegionSummaries(
      buildRegionSummaries([LUANDA, ICOLO, BENGUELA], [])
    )

    expect(groups).toHaveLength(2)
    expect(groups[0].key).toBe('grande-luanda')
    expect(groups[0].members.map(m => m.region.code)).toEqual([
      'AO-LUA',
      'AO-ICB'
    ])
    expect(groups[1].key).toBeNull()
    expect(groups[1].members.map(m => m.region.code)).toEqual(['AO-BGU'])
  })

  it('keeps every ungrouped province apart instead of merging the nulls', () => {
    const second: AdminRegion = { ...BENGUELA, code: 'AO-HUI', name: 'Huíla' }
    const groups = groupRegionSummaries(
      buildRegionSummaries([BENGUELA, second], [])
    )

    expect(groups).toHaveLength(2)
    expect(groups.map(g => g.key)).toEqual([null, null])
    expect(groups.map(g => g.members.length)).toEqual([1, 1])
    expect(groups.map(g => g.members[0].region.code)).toEqual([
      'AO-BGU',
      'AO-HUI'
    ])
  })

  it('keeps the order the API sent, by first appearance', () => {
    const groups = groupRegionSummaries(
      buildRegionSummaries([BENGUELA, LUANDA, ICOLO], [])
    )

    expect(groups.map(g => g.key)).toEqual([null, 'grande-luanda'])
  })
})

describe('buildServiceComparison', () => {
  it('returns one row per province for a single service', () => {
    const summaries = buildRegionSummaries(
      [LUANDA, BENGUELA],
      [
        profile({ region: 'AO-LUA', active: true, min_fare: 750 }),
        profile({ region: 'AO-BGU', active: false, min_fare: 500 })
      ]
    )

    const rows = buildServiceComparison(summaries, {
      ride_type: 'delivery',
      vehicle_type: 'motorcycle'
    })

    expect(rows).toHaveLength(2)
    expect(rows[0].region.code).toBe('AO-LUA')
    expect(rows[0].cell.active).toBe(true)
    expect(rows[0].cell.profile?.min_fare).toBe(750)
    expect(rows[1].cell.active).toBe(false)
  })

  it('still lists a province that has no profile for that service', () => {
    const summaries = buildRegionSummaries([LUANDA], [])
    const rows = buildServiceComparison(summaries, {
      ride_type: 'car',
      vehicle_type: 'car'
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].cell.profile).toBeNull()
  })
})

describe('orphanProfiles', () => {
  it('surfaces a profile whose region is not in the province table', () => {
    const orphans = orphanProfiles(
      [LUANDA],
      [
        profile({ region: 'AO-LUA', active: true }),
        profile({ region: 'AO-XXX', active: true })
      ]
    )

    expect(orphans).toHaveLength(1)
    expect(orphans[0].region).toBe('AO-XXX')
  })

  it('is empty when every profile sits in a known province', () => {
    expect(
      orphanProfiles([LUANDA], [profile({ region: 'AO-LUA' })])
    ).toHaveLength(0)
  })
})

describe('summariseAll', () => {
  it('totals the provinces, the live services and the pending reviews', () => {
    const summaries = buildRegionSummaries(
      [LUANDA, ICOLO, BENGUELA],
      [
        profile({ region: 'AO-LUA', active: true }),
        profile({
          region: 'AO-ICB',
          active: true,
          prices_need_review: true
        }),
        profile({
          region: 'AO-BGU',
          active: false,
          prices_need_review: true
        })
      ]
    )

    expect(summariseAll(summaries)).toEqual({
      regions: 3,
      regionsWithActive: 2,
      active: 2,
      needsReview: 2
    })
  })
})
