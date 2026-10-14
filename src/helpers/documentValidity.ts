import { ANGOLA_UTC_OFFSET_MINUTES } from '@rafaelpilartes/kandengue-shared/constants'
import type { DocumentInterface } from '@/interfaces/IDocument'

/**
 * A document carrying the expiry date that lib 2.12.0 added.
 *
 * Declared here as an intersection instead of waiting for the lib bump: the
 * shape is **the same** (`expires_at?: Date` on both `DocumentInterface` and
 * `DocumentEntity`), so this compiles against the 2.11.0 the panel pins today
 * and keeps compiling after it moves. Without it, half of this sub-phase would
 * have been waiting on an install.
 */
export type DocumentWithValidity = DocumentInterface & { expires_at?: Date }

/**
 * A document's expiry, stored as **the end of the chosen day, Luanda time**.
 *
 * ── Why not midnight ──
 * An `<input type="date">` yields `'2027-03-31'`, and converting that with
 * `new Date(value)` gives **midnight UTC**. The lib compares instants
 * (`isDocumentValidFor`: `expires_at > now`), so a policy "valid until 31/03"
 * stored that way expires at 00:00:01 on the 31st — and the driver loses the
 * day the policy still covers. Decided 2026-10-14: the writer converts; the
 * lib does not change.
 *
 * Angola is UTC+1 all year (no daylight saving), and the offset comes from the
 * lib — a hand-written `+1` does not belong in a screen file.
 *
 * It takes the **string** from the date field on purpose: `'YYYY-MM-DD'` has
 * no timezone, which is precisely why there is no ambiguity to resolve here. A
 * `Date` as input would force a choice between the local day and the UTC day.
 */
export function endOfDayInLuanda(date: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim())
  if (!m) return null

  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const endLocal = Date.UTC(year, month - 1, day, 23, 59, 59, 999)
  const instant = new Date(endLocal - ANGOLA_UTC_OFFSET_MINUTES * 60_000)

  // `Date.UTC` accepts 2026-02-31 and rolls over into March: a date the
  // calendar does not have is not an expiry date.
  const roundTrip = new Date(endLocal)
  if (roundTrip.getUTCMonth() !== month - 1 || roundTrip.getUTCDate() !== day) {
    return null
  }

  return instant
}

/** The (Luanda) day a stored expiry represents — for displaying it. */
export function dayInLuanda(expiresAt: Date): string {
  const local = new Date(expiresAt.getTime() + ANGOLA_UTC_OFFSET_MINUTES * 60_000)
  return local.toISOString().slice(0, 10)
}

/**
 * Is this document expired?
 *
 * **The same comparison the lib makes** (`expires_at > now`), deliberately: a
 * screen claiming "valid" about a document the server considers expired is
 * worse than saying nothing — the admin would approve a service and watch the
 * API refuse it without understanding why.
 */
export function isExpired(
  doc: Pick<DocumentWithValidity, 'expires_at'>,
  now: Date = new Date()
): boolean {
  if (!doc.expires_at) return false
  return doc.expires_at.getTime() <= now.getTime()
}

/** What goes in the validity column. The text itself is user-facing. */
export function validityLabel(
  doc: Pick<DocumentWithValidity, 'expires_at'>,
  now: Date = new Date()
): { text: string; expired: boolean } {
  if (!doc.expires_at) return { text: 'sem validade', expired: false }
  const expired = isExpired(doc, now)
  return {
    text: `${expired ? 'caducou' : 'válido até'} ${dayInLuanda(doc.expires_at)}`,
    expired
  }
}
