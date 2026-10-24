import type { RideInterface } from '@/interfaces/IRide'

/**
 * The phone numbers of a ride, and where each one came from.
 *
 * ── Why this exists ──
 * Since sub-phase 3.2 the contacts live in `rides/{id}/private/contacts` — a
 * separate document, readable by the owning passenger, the assigned driver and
 * an admin. Rides created before 3.2 **are not migrated** (§0A decision), so
 * the panel has to read both places: the private document first, the copy
 * embedded in the ride as a fallback.
 *
 * ⚠️ **The source is part of the result on purpose.** A phone that is missing
 * and a phone that came from the old copy are different things for someone
 * trying to call: the first does not exist, the second may be stale. Without
 * that distinction the screen showed "not available" for both.
 */
export type ContactSource = 'private' | 'ride' | null

export type Contact = {
  value: string | null
  source: ContactSource
}

export type RideContacts = {
  passenger: Contact
  driver: Contact
  sender: Contact
  receiver: Contact
}

/** The fields of the `private/contacts` document, as the server writes them. */
export type PrivateContacts = {
  passenger_phone?: string
  driver_phone?: string
  sender_phone?: string
  receiver_phone?: string
}

const trimmed = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

const pick = (fromPrivate: unknown, fromRide: unknown): Contact => {
  const p = trimmed(fromPrivate)
  if (p) return { value: p, source: 'private' }
  const r = trimmed(fromRide)
  if (r) return { value: r, source: 'ride' }
  return { value: null, source: null }
}

/**
 * Merges both places, with the private document winning.
 *
 * The private document wins because it is what the **server** writes:
 * `driver_phone` comes from the accept (or from the trigger's sync) and
 * belongs to the driver who is actually on the ride. The copy in
 * `ride.driver.phone` is a snapshot of the moment the app wrote it, and on a
 * reassigned ride it may belong to someone else.
 */
export function rideContacts(input: {
  contacts: PrivateContacts | null
  ride: Pick<RideInterface, 'user' | 'driver' | 'details'> | null
}): RideContacts {
  const { contacts, ride } = input
  const details = ride?.details as
    | {
        sender?: { phone?: string }
        receiver?: { phone?: string }
      }
    | undefined

  /*
   * ⚠️ **Os recuos do passageiro, do remetente e do destinatário saíram em
   * 2026-10-24.** A API deixa de escrever `user.phone`, `details.sender.phone`
   * e `details.receiver.phone` no documento da corrida, e o script de remoção
   * copia o que falta para `private/contacts` **antes** de apagar — por isso
   * o documento privado passa a ser a única fonte, e completa.
   *
   * ⚠️ **O do motorista FICA.** O `ride.driver.phone` não está na lista de
   * campos removidos: continua a ser escrito, e numa corrida reatribuída o
   * `private/contacts` é o que está certo — daí a ordem.
   */
  void details

  return {
    passenger: pick(contacts?.passenger_phone, undefined),
    driver: pick(contacts?.driver_phone, ride?.driver?.phone),
    sender: pick(contacts?.sender_phone, undefined),
    receiver: pick(contacts?.receiver_phone, undefined)
  }
}

/** Shown when there is no phone number at all. User-facing: Portuguese. */
export const NO_CONTACT_LABEL = 'Não disponível'

/** The `title` text, for whoever hovers over the number. */
export function explainSource(c: Contact): string | undefined {
  if (!c.value) return 'Não está nos contactos da corrida nem na cópia antiga.'
  if (c.source === 'ride') {
    return 'Copiado da corrida (anterior aos contactos privados) — pode estar velho.'
  }
  return undefined
}
