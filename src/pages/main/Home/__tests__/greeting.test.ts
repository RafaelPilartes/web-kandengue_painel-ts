import { describe, expect, it } from 'vitest'
import {
  firstName,
  greeting,
  hourInLuanda,
  timeOfDayGreeting,
  welcomeFor
} from '../greeting'
import { DAILY_MESSAGES, messageOfTheDay } from '../messages'

/** 09:00 in Luanda is 08:00 UTC: the zone is UTC+1 all year. */
const atLuanda = (hour: number) =>
  new Date(Date.UTC(2026, 9, 31, (hour + 23) % 24, 30))

describe('hourInLuanda', () => {
  it('reads the hour in Luanda, not the browser hour', () => {
    expect(hourInLuanda(new Date('2026-10-31T23:30:00Z'))).toBe(0)
    expect(hourInLuanda(new Date('2026-10-31T08:30:00Z'))).toBe(9)
  })
})

describe('timeOfDayGreeting', () => {
  it('says bom dia before noon', () => {
    expect(timeOfDayGreeting(atLuanda(0))).toBe('Bom dia')
    expect(timeOfDayGreeting(atLuanda(11))).toBe('Bom dia')
  })
  it('says boa tarde from noon to seven', () => {
    expect(timeOfDayGreeting(atLuanda(12))).toBe('Boa tarde')
    expect(timeOfDayGreeting(atLuanda(18))).toBe('Boa tarde')
  })
  it('says boa noite from seven', () => {
    expect(timeOfDayGreeting(atLuanda(19))).toBe('Boa noite')
    expect(timeOfDayGreeting(atLuanda(23))).toBe('Boa noite')
  })
})

describe('welcomeFor', () => {
  it('matches the gender when there is one', () => {
    expect(welcomeFor('female')).toBe('Bem-vinda')
    expect(welcomeFor('male')).toBe('Bem-vindo')
  })

  /*
   * The point of the whole field. Guessing from the name would address a real
   * person wrongly every time they opened the panel; the neutral form never
   * does.
   */
  it('stays neutral without a gender, and never guesses', () => {
    expect(welcomeFor(null)).toBeNull()
    expect(welcomeFor(undefined)).toBeNull()
  })
})

describe('firstName', () => {
  it('takes the first word', () => {
    expect(firstName('Rafael Pilartes')).toBe('Rafael')
    expect(firstName('  Batílcia   Gonçalves ')).toBe('Batílcia')
  })
  it('survives an empty name', () => {
    expect(firstName('')).toBe('')
    expect(firstName(null)).toBe('')
  })
})

describe('greeting', () => {
  it('greets with the gender when there is one', () => {
    expect(greeting('Batílcia Gonçalves', 'female', atLuanda(9))).toBe(
      'Bom dia, Bem-vinda, Batílcia.'
    )
    expect(greeting('Rafael Pilartes', 'male', atLuanda(20))).toBe(
      'Boa noite, Bem-vindo, Rafael.'
    )
  })

  it('greets without it when there is none', () => {
    expect(greeting('Alguém Qualquer', null, atLuanda(14))).toBe(
      'Boa tarde, Alguém.'
    )
  })

  it('greets with no name at all', () => {
    expect(greeting('', null, atLuanda(9))).toBe('Bom dia.')
  })
})

describe('messageOfTheDay', () => {
  it('offers between 20 and 30 lines', () => {
    expect(DAILY_MESSAGES.length).toBeGreaterThanOrEqual(20)
    expect(DAILY_MESSAGES.length).toBeLessThanOrEqual(30)
  })

  it('has no repeated line', () => {
    expect(new Set(DAILY_MESSAGES).size).toBe(DAILY_MESSAGES.length)
  })

  /*
   * A sentence that changes while it is being read is worse than no sentence:
   * `Math.random()` would move it on every re-render.
   */
  it('gives the same line all day to the same admin', () => {
    const morning = new Date(2026, 9, 31, 7)
    const evening = new Date(2026, 9, 31, 22)
    expect(messageOfTheDay('adm-1', morning)).toBe(
      messageOfTheDay('adm-1', evening)
    )
  })

  it('gives different admins different lines on the same day', () => {
    const day = new Date(2026, 9, 31, 9)
    const lines = new Set(
      ['adm-1', 'adm-2', 'adm-3', 'adm-4', 'adm-5'].map(id =>
        messageOfTheDay(id, day)
      )
    )
    expect(lines.size).toBeGreaterThan(1)
  })

  it('changes from one day to the next', () => {
    const lines = new Set(
      [1, 2, 3, 4, 5, 6, 7].map(d =>
        messageOfTheDay('adm-1', new Date(2026, 9, d))
      )
    )
    expect(lines.size).toBeGreaterThan(1)
  })

  it('always returns one of the lines', () => {
    for (let d = 1; d <= 60; d += 1) {
      const line = messageOfTheDay('adm-x', new Date(2026, 9, d))
      expect(DAILY_MESSAGES).toContain(line)
    }
  })

  it('survives an empty list instead of throwing', () => {
    expect(messageOfTheDay('adm-1', new Date(), [])).toBe('')
  })
})
