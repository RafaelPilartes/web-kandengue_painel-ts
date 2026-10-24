import {
  RIDE_TYPES,
  VEHICLE_TYPES,
  type RideType,
  type VehicleType
} from '@rafaelpilartes/kandengue-shared/enums'
import { isValidRideVehiclePair } from '@rafaelpilartes/kandengue-shared/functions'
import type {
  AdminRegion,
  PricingProfileView
} from '@/core/interfaces/IPricingRepository'

/**
 * Grouping the prices page by province — **presentation only**.
 *
 * ⚠️ **No data changes shape here.** A profile is still one document per
 * region × ride × vehicle, written by the API, and `region` stays the field it
 * always was. What this file does is read the province list from
 * `GET /api/v1/admin/regions` and arrange the profiles under it, which is what
 * was decided on 2026-10-23 — "agrupado só na apresentação, sem mudar os
 * dados".
 *
 * It is pure on purpose: 21 provinces × 4 services is the kind of counting
 * that is wrong in a way nobody notices on screen, and a test catches it.
 */

/** One sellable service: a ride type with a vehicle the lib allows for it. */
export type PricingService = {
  ride_type: RideType
  vehicle_type: VehicleType
}

/**
 * The services, derived from the lib and not written out by hand.
 *
 * ⚠️ **Four, and the fourth is `car × car`.** The seed script creates the same
 * four, by Rafael's decision on 2026-10-24: without `car × car` Luanda showed
 * four services and every other province three, and the difference had no
 * explanation on screen. Deriving the list means a fifth pair in the lib shows
 * up here on its own.
 */
export const PRICING_SERVICES: PricingService[] = RIDE_TYPES.flatMap(
  ride_type =>
    VEHICLE_TYPES.filter(vehicle_type =>
      isValidRideVehiclePair(ride_type, vehicle_type)
    ).map(vehicle_type => ({ ride_type, vehicle_type }))
)

/** A stable key for a service, for React lists and lookups. */
export function serviceKey(service: PricingService): string {
  return `${service.ride_type}:${service.vehicle_type}`
}

/** One service of one province: the profile, or the absence of one. */
export type RegionServiceCell = PricingService & {
  profile: PricingProfileView | null
  active: boolean
  needsReview: boolean
}

export type RegionSummary = {
  region: AdminRegion
  cells: RegionServiceCell[]
  /** How many services are live, and therefore quotable, in this province. */
  activeCount: number
  /** How many carry the seed's mark — nobody has looked at the numbers. */
  needsReviewCount: number
  /** How many of the services have no profile document at all. */
  missingCount: number
}

function cellFor(
  service: PricingService,
  profiles: PricingProfileView[]
): RegionServiceCell {
  const profile =
    profiles.find(
      p =>
        p.ride_type === service.ride_type &&
        p.vehicle_type === service.vehicle_type
    ) ?? null

  return {
    ...service,
    profile,
    active: profile?.active === true,
    needsReview: profile?.prices_need_review === true
  }
}

/**
 * One summary per province, in the order the API sent them (sorted by name,
 * in Portuguese).
 *
 * ⚠️ **The provinces come from `regions`, never from the profiles.** A
 * province with no profile at all still has to appear — it is precisely the
 * one someone has to go and look at — and a profile whose `region` is not in
 * the table would otherwise invent a province on screen.
 */
export function buildRegionSummaries(
  regions: AdminRegion[],
  profiles: PricingProfileView[]
): RegionSummary[] {
  return regions.map(region => {
    const inRegion = profiles.filter(p => p.region === region.code)
    const cells = PRICING_SERVICES.map(service => cellFor(service, inRegion))

    return {
      region,
      cells,
      activeCount: cells.filter(c => c.active).length,
      needsReviewCount: cells.filter(c => c.needsReview).length,
      missingCount: cells.filter(c => c.profile === null).length
    }
  })
}

/**
 * Profiles whose `region` is not one of the 21 provinces.
 *
 * Normally empty. It is on screen because the alternative is worse: a profile
 * under a code the table does not know is invisible in a grouped view, and
 * invisible is how a price nobody meant to leave live stays live.
 */
export function orphanProfiles(
  regions: AdminRegion[],
  profiles: PricingProfileView[]
): PricingProfileView[] {
  const known = new Set(regions.map(r => r.code))
  return profiles.filter(p => !known.has(p.region))
}

export type RegionGroup = {
  /** The `group` field, or `null` for a province that stands alone. */
  key: string | null
  members: RegionSummary[]
}

/**
 * The provinces arranged by **operating area**.
 *
 * ⚠️ **A group is not a province, and this is the whole reason it exists.**
 * Luanda and Icolo e Bengo share `grande-luanda` because the Dr. António
 * Agostinho Neto airport sits in Icolo e Bengo — a ride from the centre of
 * Luanda to Luanda's own airport crosses a provincial border, and without the
 * group it was refused. Prices still come from the pickup province's profile;
 * the group only decides whether the destination is servable.
 *
 * The order of the groups follows the first member's position in the input, so
 * the alphabetical order the API sent survives.
 */
export function groupRegionSummaries(
  summaries: RegionSummary[]
): RegionGroup[] {
  const groups: RegionGroup[] = []
  const byKey = new Map<string, RegionGroup>()

  for (const summary of summaries) {
    const key = summary.region.group

    // A province with no group is its own block, and never merges with
    // another one: `null` is an absence, not a shared value.
    if (!key) {
      groups.push({ key: null, members: [summary] })
      continue
    }

    const existing = byKey.get(key)
    if (existing) {
      existing.members.push(summary)
      continue
    }

    const group: RegionGroup = { key, members: [summary] }
    byKey.set(key, group)
    groups.push(group)
  }

  return groups
}

export type ServiceComparisonRow = {
  region: AdminRegion
  cell: RegionServiceCell
}

/**
 * The same service across every province, for comparing prices between them.
 *
 * This is the view that answers "what do we charge per km for deliveries, and
 * where" — which the per-province view cannot, because it shows one province
 * at a time.
 */
export function buildServiceComparison(
  summaries: RegionSummary[],
  service: PricingService
): ServiceComparisonRow[] {
  const key = serviceKey(service)

  return summaries.flatMap(summary => {
    const cell = summary.cells.find(c => serviceKey(c) === key)
    return cell ? [{ region: summary.region, cell }] : []
  })
}

/** Totals for the header, so the counting is not repeated in the markup. */
export function summariseAll(summaries: RegionSummary[]): {
  regions: number
  regionsWithActive: number
  needsReview: number
  active: number
} {
  return {
    regions: summaries.length,
    regionsWithActive: summaries.filter(s => s.activeCount > 0).length,
    needsReview: summaries.reduce((sum, s) => sum + s.needsReviewCount, 0),
    active: summaries.reduce((sum, s) => sum + s.activeCount, 0)
  }
}
