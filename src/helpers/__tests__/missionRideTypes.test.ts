import { describe, expect, it } from 'vitest'
import {
  MISSION_SERVICES,
  missionRideTypesWrite,
  missionServicesSummary,
  readMissionRideTypes
} from '@/helpers/missionRideTypes'

describe('readMissionRideTypes', () => {
  it('a mission with no ride_types is not restricted', () => {
    expect(readMissionRideTypes({})).toEqual({
      restricted: false,
      selected: []
    })
  })

  /*
   * Absent and empty mean the same thing everywhere else, so the form must
   * not show `[]` as a restriction the administrator chose.
   */
  it('an empty ride_types is not a restriction', () => {
    expect(readMissionRideTypes({ ride_types: [] })).toEqual({
      restricted: false,
      selected: []
    })
  })

  it('a stored list comes back as a restriction', () => {
    expect(readMissionRideTypes({ ride_types: ['moto_taxi', 'car'] })).toEqual({
      restricted: true,
      selected: ['moto_taxi', 'car']
    })
  })

  it('does not hand back the stored array itself', () => {
    const stored: Array<'moto_taxi'> = ['moto_taxi']
    const read = readMissionRideTypes({ ride_types: stored })

    read.selected.push('car' as never)
    expect(stored).toEqual(['moto_taxi'])
  })
})

describe('missionRideTypesWrite', () => {
  /*
   * ⚠️ `'all'` and not `ride_types: undefined`: Firestore is initialised with
   * `ignoreUndefinedProperties: true`, so `undefined` in an `updateDoc` is
   * dropped and an existing restriction would survive the edit. The caller
   * has to write `deleteField()`, and this is what tells it to.
   */
  it('unrestricted asks for the field to be cleared', () => {
    expect(missionRideTypesWrite({ restricted: false, selected: [] })).toEqual({
      kind: 'all'
    })
    expect(
      missionRideTypesWrite({ restricted: false, selected: ['car'] })
    ).toEqual({ kind: 'all' })
  })

  it('a restricted selection is written as a list', () => {
    expect(
      missionRideTypesWrite({ restricted: true, selected: ['car'] })
    ).toEqual({ kind: 'some', ride_types: ['car'] })
  })

  it('refuses an empty selection instead of widening it', () => {
    const result = missionRideTypesWrite({ restricted: true, selected: [] })

    expect(result.kind).toBe('invalid')
    expect(result.kind === 'invalid' && result.message).toContain('ao menos um')
  })

  /*
   * Storing all three would freeze the mission on today's services: adding a
   * fourth would leave it silently excluded.
   */
  it('every service ticked is the same as unrestricted', () => {
    const all = MISSION_SERVICES.map(s => s.value)

    expect(missionRideTypesWrite({ restricted: true, selected: all })).toEqual({
      kind: 'all'
    })
  })

  it('normalises order and duplicates, so the audit diff does not fire on order', () => {
    const a = missionRideTypesWrite({
      restricted: true,
      selected: ['car', 'moto_taxi']
    })
    const b = missionRideTypesWrite({
      restricted: true,
      selected: ['moto_taxi', 'car', 'car']
    })

    expect(a).toEqual(b)
  })

  it('drops a value that is not a service', () => {
    const result = missionRideTypesWrite({
      restricted: true,
      selected: ['car', 'bicicleta' as never]
    })

    expect(result).toEqual({ kind: 'some', ride_types: ['car'] })
  })
})

describe('missionServicesSummary', () => {
  it('says every service when there is no restriction', () => {
    expect(missionServicesSummary({})).toBe('Todos os serviços')
    expect(missionServicesSummary({ ride_types: [] })).toBe('Todos os serviços')
  })

  it('names the services when there is one', () => {
    expect(missionServicesSummary({ ride_types: ['moto_taxi', 'car'] })).toBe(
      'Moto-táxi, Carro'
    )
  })
})
