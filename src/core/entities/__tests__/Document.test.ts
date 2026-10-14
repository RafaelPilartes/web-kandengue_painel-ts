import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import type { QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'
import { documentConverter } from '@/core/entities/Document'
import { estaCaducado, rotuloValidade } from '@/helpers/documentValidity'
import type { DocumentoComValidade } from '@/helpers/documentValidity'

/** Snapshot mínimo — só o que o converter usa. */
function snapshotOf(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: (_options?: SnapshotOptions) => data
  } as unknown as QueryDocumentSnapshot
}

const base = {
  user: { id: 'dri-1' },
  type: 'insurance',
  url: 'https://exemplo/apolice.pdf',
  status: 'approved'
}

/**
 * A validade de um documento, **pelo caminho que o ecrã usa**.
 *
 * ⚠️ **Achado pela revisão independente da Fase 4, e é por isto que este
 * ficheiro existe.** Os testes da aritmética do fuso horário passavam com
 * `Date`s construídos à mão e não provavam nada do caminho real: o converter
 * não declarava `expires_at`, a `DocumentEntity` da lib 2.11.0 descarta o que
 * não declara, e a coluna de validade dizia "sem validade" para **todos** os
 * documentos — mesmo os aprovados com data. Um teste que não passa pelo
 * converter não prova que a validade chega ao ecrã.
 */
describe('documentConverter.fromFirestore', () => {
  it('a validade sai como `Date`, não como Timestamp', () => {
    const validade = new Date('2027-03-31T22:59:59.999Z')
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-1', {
        ...base,
        expires_at: Timestamp.fromDate(validade),
        created_at: Timestamp.fromDate(new Date('2026-10-14T08:00:00Z')),
        updated_at: null
      })
    ) as DocumentoComValidade

    expect(entity.expires_at).toBeInstanceOf(Date)
    expect(entity.expires_at?.toISOString()).toBe(validade.toISOString())
  })

  it('sem validade, o campo fica ausente — e não a meia-noite de 1970', () => {
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-2', { ...base, created_at: null, updated_at: null })
    ) as DocumentoComValidade
    expect(entity.expires_at).toBeUndefined()
  })

  /*
   * ⚠️ **O segundo meio do defeito.** Com a lib 3.0.0 o construtor passa a
   * guardar o `expires_at` que lhe chega; se o converter não o convertesse,
   * o que ficava lá era o `Timestamp` cru — e o `estaCaducado` chamava
   * `.getTime()` num objecto que não o tem. Rebentava o render da tabela de
   * documentos de qualquer motorista com um documento com validade.
   */
  it('o que sai do converter atravessa os helpers sem rebentar', () => {
    const entity = documentConverter.fromFirestore(
      snapshotOf('doc-3', {
        ...base,
        expires_at: Timestamp.fromDate(new Date('2026-01-05T22:59:59.999Z')),
        created_at: null,
        updated_at: null
      })
    ) as DocumentoComValidade

    const agora = new Date('2026-10-14T12:00:00Z')
    expect(() => estaCaducado(entity, agora)).not.toThrow()
    expect(estaCaducado(entity, agora)).toBe(true)
    expect(rotuloValidade(entity, agora)).toEqual({
      texto: 'caducou 2026-01-05',
      caducado: true
    })
  })
})
