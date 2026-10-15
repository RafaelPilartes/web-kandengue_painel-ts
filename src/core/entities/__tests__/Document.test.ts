import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import type { QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'
import { documentConverter, isFromDeletedAccount } from '@/core/entities/Document'
import { isExpired, validityLabel } from '@/helpers/documentValidity'
import type { DocumentWithValidity } from '@/helpers/documentValidity'

/** Minimal snapshot — only what the converter touches. */
function snapshotOf(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: (_options?: SnapshotOptions) => data
  } as unknown as QueryDocumentSnapshot
}

const base = {
  user: { id: 'dri-1' },
  type: 'insurance',
  url: 'https://example/policy.pdf',
  status: 'approved'
}

/**
 * A document's expiry, **through the path the screen uses**.
 *
 * ⚠️ **Found by the independent review of phase 4, and that is why this file
 * exists.** The timezone-arithmetic tests passed with hand-built `Date`s and
 * proved nothing about the real path: the converter did not declare
 * `expires_at`, lib 2.11.0's `DocumentEntity` discards what it does not
 * declare, and the validity column said "sem validade" for **every** document
 * — including ones just approved with a date. A test that does not go through
 * the converter does not prove the expiry reaches the screen.
 */
describe('documentConverter.fromFirestore', () => {
  it('yields the expiry as a `Date`, not a Timestamp', () => {
    const expiry = new Date('2027-03-31T22:59:59.999Z')
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-1', {
        ...base,
        expires_at: Timestamp.fromDate(expiry),
        created_at: Timestamp.fromDate(new Date('2026-10-14T08:00:00Z')),
        updated_at: null
      })
    ) as DocumentWithValidity

    expect(entity.expires_at).toBeInstanceOf(Date)
    expect(entity.expires_at?.toISOString()).toBe(expiry.toISOString())
  })

  it('leaves the field absent when there is no expiry — not midnight 1970', () => {
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-2', { ...base, created_at: null, updated_at: null })
    ) as DocumentWithValidity
    expect(entity.expires_at).toBeUndefined()
  })

  /*
   * ⚠️ **The second half of the defect.** With lib 3.0.0 the constructor keeps
   * the `expires_at` it is given; had the converter not converted it, what sat
   * there would be the raw `Timestamp` — and `isExpired` would call
   * `.getTime()` on an object that has no such method. It blew up the render
   * of the documents table for any driver with a document that expires.
   */
  it('survives the helpers on the way out of the converter', () => {
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-3', {
        ...base,
        expires_at: Timestamp.fromDate(new Date('2026-01-05T22:59:59.999Z')),
        created_at: null,
        updated_at: null
      })
    ) as DocumentWithValidity

    const now = new Date('2026-10-14T12:00:00Z')
    expect(() => isExpired(entity, now)).not.toThrow()
    expect(isExpired(entity, now)).toBe(true)
    expect(validityLabel(entity, now)).toEqual({
      text: 'caducou 2026-01-05',
      expired: true
    })
  })
})

/**
 * The deleted-account flag, **through the converter** — same lesson as the
 * expiry above.
 *
 * The owner decided on 2026-10-15 that a deleted driver's documents stay
 * (licensing) and are **not reachable from the panel**. The flag is how the
 * panel knows, and lib 3.0.0's `DocumentEntity` copies field by field: a flag
 * the class does not declare is dropped here, silently, and the filter that
 * depends on it would never hide anything. A test on `isFromDeletedAccount`
 * alone would have passed while the panel kept showing the documents.
 */
describe('documentConverter — the deleted-account flag', () => {
  it('carries the flag through, although the lib class drops it', () => {
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-del', { ...base, account_deleted: true }),
      {} as SnapshotOptions
    )

    expect(isFromDeletedAccount(entity)).toBe(true)
  })

  it('reads a document with no flag as a live account', () => {
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-live', base),
      {} as SnapshotOptions
    )

    expect(isFromDeletedAccount(entity)).toBe(false)
  })

  /** Only the literal `true`. A stray string is not a deleted account. */
  it('does not treat a truthy value as the flag', () => {
    for (const value of ['true', 1, {}, 'yes']) {
      const entity = documentConverter.fromFirestore(
        snapshotOf('doc-x', { ...base, account_deleted: value }),
        {} as SnapshotOptions
      )
      expect(isFromDeletedAccount(entity), String(value)).toBe(false)
    }
  })

  it('keeps everything else the panel renders', () => {
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-del', { ...base, account_deleted: true }),
      {} as SnapshotOptions
    )

    // The document itself is untouched: it stays approved, and it stays a
    // licence. What changes is only that the panel will not list it.
    expect(entity.status).toBe('approved')
    expect(entity.type).toBe('insurance')
    expect(entity.url).toBe('https://example/policy.pdf')
  })
})
