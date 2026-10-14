import { describe, expect, it } from 'vitest'
import { ApiError, mapApiError, missingRequirements, stripMarkdown } from '../apiError'
import { requirementDetail } from '@/core/interfaces/IAdminDriverRepository'

/**
 * The API's error contract, on the panel side.
 *
 * ⚠️ **The rule this guards is the §0A one:** the `message` of a validation or
 * technical error **never** reaches a screen. It was through a channel without
 * that separation that `body/code Code must contain only A-Z…` reached a
 * passenger's screen.
 */
const anError = (over: Partial<{
  message: string
  status: number | null
  code: string | null
  userMessage: string | null
  details: unknown
}> = {}) =>
  new ApiError(
    over.message ?? 'Validation error',
    over.status === undefined ? 400 : over.status,
    over.code ?? null,
    over.userMessage ?? null,
    over.details ?? null
  )

describe('mapApiError', () => {
  it('shows the business user_message verbatim', () => {
    expect(
      mapApiError(anError({ userMessage: 'Faltam requisitos para Moto Táxi.' }))
    ).toBe('Faltam requisitos para Moto Táxi.')
  })

  it('without user_message, the sentence comes from the status — never the technical one', () => {
    const technical = 'body/service Invalid enum value'
    expect(mapApiError(anError({ message: technical, status: 400 }))).not.toContain(
      'enum'
    )
    expect(mapApiError(anError({ status: 401 }))).toMatch(/sessão expirou/i)
    expect(mapApiError(anError({ status: 403 }))).toMatch(/permissão/i)
    expect(mapApiError(anError({ status: 409 }))).toMatch(/estado mudou/i)
    expect(mapApiError(anError({ status: 429 }))).toMatch(/pedidos/i)
    expect(mapApiError(anError({ status: 503 }))).toMatch(/servidor falhou/i)
  })

  it('says so when the server did not answer', () => {
    expect(mapApiError(anError({ status: null }))).toMatch(/ligação/i)
  })

  // An error that is not ours (an `Error` from the Firestore SDK, say) keeps
  // its message: there, that is all we have.
  it('passes through the message of a non-ApiError', () => {
    expect(mapApiError(new Error('permission-denied'))).toBe('permission-denied')
    expect(mapApiError(undefined, 'generic')).toBe('generic')
  })
})

describe('missingRequirements', () => {
  const withMissing = (missing: unknown) =>
    anError({ code: 'SERVICE_REQUIREMENTS_NOT_MET', details: { missing } })

  it('reads the list from the refusal details', () => {
    const list = [
      { key: 'insurance', label: 'Seguro', kind: 'document', detalhe: 'não foi submetido' },
      { key: 'extra_helmet', label: 'Capacete extra', kind: 'manual', detalhe: 'exige confirmação explícita' }
    ]
    expect(missingRequirements(withMissing(list))).toEqual(list)
  })

  it('returns nothing for any other error', () => {
    expect(missingRequirements(anError({ code: 'NOT_FOUND' }))).toEqual([])
    expect(missingRequirements(new Error('anything'))).toEqual([])
  })

  /*
   * ⚠️ **It invents nothing.** If a newer API changes the shape of `details`,
   * the panel shows its sentence instead of a half-read list.
   */
  it('returns empty for a details payload in another shape', () => {
    for (const junk of [null, {}, { missing: 'seguro' }, { missing: [1, 2] }]) {
      expect(missingRequirements(withMissing((junk as { missing?: unknown })?.missing)), JSON.stringify(junk)).toEqual([])
    }
  })

  it('drops entries without key or label', () => {
    const r = missingRequirements(
      withMissing([{ key: 'insurance', label: 'Seguro' }, { key: 'x' }, {}])
    )
    expect(r).toHaveLength(1)
  })
})

describe('stripMarkdown', () => {
  /*
   * The API writes emphasis in markdown because the same strings go to logs
   * and to HTTP responses. The panel renders plain text.
   */
  it('removes asterisks and backticks', () => {
    expect(stripMarkdown('aprovado mas **caducado**')).toBe('aprovado mas caducado')
    expect(stripMarkdown('a distância **estimada** da `cotação`')).toBe(
      'a distância estimada da cotação'
    )
  })

  it('leaves unmarked text alone', () => {
    expect(stripMarkdown('não foi submetido')).toBe('não foi submetido')
  })
})

/*
 * The detail arrives under two keys, for one deploy only (3.10f).
 *
 * The API serves both `detalhe` (since 3.7, what production reads) and
 * `detail` (English, added in 3.10), because this panel ships by upload and
 * the two ends cannot change in the same instant. These cases pin the three
 * states the panel has to survive: an API that sends only the old key, one
 * that sends only the new, and one that sends both.
 */
describe('requirementDetail', () => {
  it('prefers the English key when the API sends both', () => {
    expect(
      requirementDetail({
        key: 'insurance',
        label: 'Seguro',
        kind: 'document',
        detail: 'not submitted',
        detalhe: 'não foi submetido'
      })
    ).toBe('not submitted')
  })

  it('falls back to the Portuguese key, which is what production sends today', () => {
    expect(
      requirementDetail({
        key: 'insurance',
        label: 'Seguro',
        kind: 'document',
        detalhe: 'não foi submetido'
      })
    ).toBe('não foi submetido')
  })

  it('reads the English key alone, which is what the next round sends', () => {
    expect(
      requirementDetail({
        key: 'insurance',
        label: 'Seguro',
        kind: 'document',
        detail: 'não foi submetido'
      })
    ).toBe('não foi submetido')
  })

  /*
   * Neither key is survivable: the admin sees a requirement with no
   * explanation, which is worse than before and better than a crash in the
   * approval screen.
   */
  it('returns an empty string when neither key is there', () => {
    expect(
      requirementDetail({ key: 'insurance', label: 'Seguro', kind: 'document' })
    ).toBe('')
  })
})
