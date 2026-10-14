import { describe, expect, it } from 'vitest'
import {
  dayInLuanda,
  endOfDayInLuanda,
  isExpired,
  validityLabel
} from '../documentValidity'

/**
 * A document's expiry date.
 *
 * ⚠️ **What these cases protect is a driver's working day.** An
 * `<input type="date">` yields `'2027-03-31'` and `new Date(value)` turns that
 * into midnight UTC; the lib compares instants, so the policy "valid until
 * 31/03" expired at 00:00:01 on the 31st. Angola is UTC+1.
 */
describe('endOfDayInLuanda', () => {
  it('returns the last instant of the chosen day, Luanda time', () => {
    const d = endOfDayInLuanda('2027-03-31')
    // 23:59:59.999 in Luanda (UTC+1) is 22:59:59.999 UTC on the same day.
    expect(d?.toISOString()).toBe('2027-03-31T22:59:59.999Z')
  })

  it('covers the whole chosen day, and not the next one', () => {
    const limit = endOfDayInLuanda('2026-10-14') as Date
    // Midday in Luanda on the 14th: still valid.
    const midday14 = new Date('2026-10-14T11:00:00Z')
    expect(limit.getTime() > midday14.getTime()).toBe(true)
    // 1am in Luanda on the 15th (= 00:00Z on the 15th): no longer.
    const earlyThe15th = new Date('2026-10-15T00:00:00Z')
    expect(limit.getTime() > earlyThe15th.getTime()).toBe(false)
  })

  it('rejects a date the calendar does not have', () => {
    for (const value of ['2026-02-31', '2026-13-01', '2026-00-10']) {
      expect(endOfDayInLuanda(value), value).toBeNull()
    }
  })

  it('returns null for garbage instead of inventing a date', () => {
    for (const value of ['', '  ', '31/03/2027', '2027-3-1', 'amanhã']) {
      expect(endOfDayInLuanda(value), value).toBeNull()
    }
  })

  // Round trip: what we store is shown back as the day the admin picked.
  it('round-trips the day through dayInLuanda', () => {
    for (const day of ['2026-10-14', '2027-01-01', '2026-12-31']) {
      expect(dayInLuanda(endOfDayInLuanda(day) as Date), day).toBe(day)
    }
  })
})

describe('isExpired', () => {
  const now = new Date('2026-10-14T12:00:00Z')

  it('never expires without an expiry date', () => {
    expect(isExpired({}, now)).toBe(false)
    expect(isExpired({ expires_at: undefined }, now)).toBe(false)
  })

  it('uses the same comparison as the lib: `expires_at > now`', () => {
    expect(isExpired({ expires_at: new Date('2026-10-14T12:00:01Z') }, now)).toBe(false)
    expect(isExpired({ expires_at: now }, now)).toBe(true)
    expect(isExpired({ expires_at: new Date('2026-10-14T11:59:59Z') }, now)).toBe(true)
  })

  /*
   * ⚠️ The case the conversion exists to avoid: midnight of the day itself
   * counts as expired. That is what happens to anyone storing the raw date.
   */
  it('treats midnight of the day as expired — and the end of day as valid', () => {
    expect(isExpired({ expires_at: new Date('2026-10-14T00:00:00Z') }, now)).toBe(true)
    expect(
      isExpired({ expires_at: endOfDayInLuanda('2026-10-14') as Date }, now)
    ).toBe(false)
  })
})

describe('validityLabel', () => {
  const now = new Date('2026-10-14T12:00:00Z')

  it('states the day, and whether it has passed', () => {
    expect(validityLabel({ expires_at: endOfDayInLuanda('2027-03-31') as Date }, now)).toEqual({
      text: 'válido até 2027-03-31',
      expired: false
    })
    expect(validityLabel({ expires_at: endOfDayInLuanda('2026-01-05') as Date }, now)).toEqual({
      text: 'caducou 2026-01-05',
      expired: true
    })
  })

  it('says there is no expiry instead of inventing a date', () => {
    expect(validityLabel({}, now)).toEqual({
      text: 'sem validade',
      expired: false
    })
  })
})
