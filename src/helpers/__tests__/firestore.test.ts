import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import { toDate } from '@/helpers/firestore'

describe('toDate', () => {
  it('converte Timestamp em Date', () => {
    const d = new Date('2026-01-15T10:30:00.000Z')
    expect(toDate(Timestamp.fromDate(d))).toEqual(d)
  })

  it('devolve a própria Date sem alterar', () => {
    const d = new Date('2026-01-15T10:30:00.000Z')
    expect(toDate(d)).toBe(d)
  })

  it('converte string ISO em Date', () => {
    expect(toDate('2026-01-15T10:30:00.000Z')).toEqual(
      new Date('2026-01-15T10:30:00.000Z')
    )
  })

  it('devolve null para null e undefined', () => {
    expect(toDate(null)).toBeNull()
    expect(toDate(undefined)).toBeNull()
  })
})
