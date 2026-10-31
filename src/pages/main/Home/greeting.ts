/**
 * The greeting at the top of the home page: the time of day in Luanda, and the
 * admin's own name with the right ending.
 */

export type AdminGender = 'female' | 'male'

/** Luanda is UTC+1 and keeps no summer time, but the zone says so, not us. */
const LUANDA = 'Africa/Luanda'

/**
 * The hour in Luanda, whatever the browser's clock is set to.
 *
 * ⚠️ Read through `Intl`, not by adding an offset: an admin opening the panel
 * from another country would otherwise be greeted by their own morning, and a
 * hardcoded +1 is a fact about today that nobody would remember to check.
 */
export function hourInLuanda(now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat('pt-PT', {
    timeZone: LUANDA,
    hour: 'numeric',
    hour12: false
  }).format(now)
  return Number.parseInt(hour, 10) % 24
}

/** Bom dia until noon, boa tarde until 7pm, boa noite after that. */
export function timeOfDayGreeting(now: Date = new Date()): string {
  const hour = hourInLuanda(now)
  if (hour < 12) return 'Bom dia'
  if (hour < 19) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * "Bem-vindo" / "Bem-vinda", or neither.
 *
 * ⚠️ Without a gender on the account the greeting is NEUTRAL, and is never
 * guessed from the name. A name does not carry a gender reliably in any
 * language, and getting it wrong addresses a real person wrongly every single
 * time they open the panel — which the neutral form never does.
 */
export function welcomeFor(gender: AdminGender | null | undefined): string | null {
  if (gender === 'female') return 'Bem-vinda'
  if (gender === 'male') return 'Bem-vindo'
  return null
}

/** The first name, which is what a greeting uses. */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? ''
}

export function greeting(
  name: string | null | undefined,
  gender: AdminGender | null | undefined,
  now: Date = new Date()
): string {
  const welcome = welcomeFor(gender)
  const who = firstName(name)
  const head = welcome
    ? `${timeOfDayGreeting(now)}, ${welcome}`
    : timeOfDayGreeting(now)
  return who ? `${head}, ${who}.` : `${head}.`
}
