import {
  RIDE_TYPES,
  type RideType
} from '@rafaelpilartes/kandengue-shared/enums'

/*
 * Which services a mission counts — the form's decision, pure.
 *
 * ⚠️ **It lives here, and not in the page, because of `ride_types: undefined`.**
 * `firebase.config.ts` initialises Firestore with
 * `ignoreUndefinedProperties: true`, so an `updateDoc` carrying
 * `ride_types: undefined` **silently drops the key** — editing a restricted
 * mission back to "every service" would leave the restriction standing, and
 * the form would show the right thing while the document kept the wrong one.
 * Clearing the field needs `deleteField()`, which is a decision worth a test.
 */

/** The label each service carries in the form. Read by an administrator. */
const SERVICE_LABELS: Record<RideType, string> = {
  moto_taxi: 'Moto-táxi',
  car: 'Carro',
  delivery: 'Entrega'
}

export const MISSION_SERVICES: ReadonlyArray<{
  value: RideType
  label: string
}> = RIDE_TYPES.map(value => ({ value, label: SERVICE_LABELS[value] }))

export function missionServiceLabel(type: RideType): string {
  return SERVICE_LABELS[type]
}

/** What the form shows for a mission that already exists. */
export function readMissionRideTypes(mission: {
  ride_types?: RideType[] | undefined
}): { restricted: boolean; selected: RideType[] } {
  const stored = mission.ride_types

  /*
   * Absent **and empty** both mean "every service" — the same reading the lib
   * and both servers use. An empty array taken literally would make the
   * mission unreachable, so the form must not present it as a restriction the
   * administrator chose.
   */
  if (!stored || stored.length === 0) return { restricted: false, selected: [] }

  return { restricted: true, selected: [...stored] }
}

export type MissionRideTypesWrite =
  /** Every service: the caller must write `deleteField()`, not `undefined`. */
  | { kind: 'all' }
  | { kind: 'some'; ride_types: RideType[] }
  /** The form must refuse to save, and say this. */
  | { kind: 'invalid'; message: string }

/**
 * What to write for the services the administrator picked.
 *
 * ⚠️ **An empty selection is refused, not silently widened.** Everything that
 * reads the field treats `[]` as "every service", so saving it would hand a
 * mission every service while the form said "only these" — the administrator
 * would have no way to see the difference. Refusing is the only reading that
 * does not lie in one direction or the other.
 */
export function missionRideTypesWrite(input: {
  restricted: boolean
  selected: readonly RideType[]
}): MissionRideTypesWrite {
  if (!input.restricted) return { kind: 'all' }

  // Deduplicated and in the enum's order, so two missions with the same
  // services compare equal and the audit diff does not fire on order alone.
  const chosen = RIDE_TYPES.filter(type => input.selected.includes(type))

  if (chosen.length === 0) {
    return {
      kind: 'invalid',
      message:
        'Escolhe ao menos um serviço, ou marca "Todos os serviços": uma missão sem serviços não conta nenhuma corrida.'
    }
  }

  // Every service ticked is the same thing as "every service", and storing it
  // as a list would keep a mission frozen on today's three when a fourth
  // service is added.
  if (chosen.length === RIDE_TYPES.length) return { kind: 'all' }

  return { kind: 'some', ride_types: chosen }
}

/** How the card describes the restriction. */
export function missionServicesSummary(mission: {
  ride_types?: RideType[] | undefined
}): string {
  const { restricted, selected } = readMissionRideTypes(mission)
  if (!restricted) return 'Todos os serviços'

  return selected.map(missionServiceLabel).join(', ')
}
