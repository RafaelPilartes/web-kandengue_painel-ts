import { describe, it, expect } from 'vitest'
import { AppError, toAppError } from '@/domain/errors/AppError'

describe('toAppError', () => {
  it('mapeia firestore/permission-denied', () => {
    const err = toAppError({ code: 'firestore/permission-denied' })

    expect(err).toBeInstanceOf(AppError)
    expect(err.code).toBe('permission-denied')
    expect(err.message).toContain('Não tem permissão')
  })

  it('mapeia auth/unauthenticated', () => {
    expect(toAppError({ code: 'auth/unauthenticated' }).code).toBe(
      'unauthenticated'
    )
  })

  it('cai em unknown para códigos não mapeados', () => {
    expect(toAppError({ code: 'firestore/aborted' }).code).toBe('unknown')
    expect(toAppError(new Error('boom')).code).toBe('unknown')
  })

  it('prefixa a mensagem com o contexto', () => {
    const err = toAppError(
      { code: 'firestore/not-found' },
      '[vehicles.getById]'
    )

    expect(err.message).toBe('[vehicles.getById] Registo não encontrado.')
  })

  it('preserva o erro original', () => {
    const original = { code: 'firestore/unavailable' }

    expect(toAppError(original).original).toBe(original)
  })

  it('AppError é lançável e apanhável', () => {
    expect(() => {
      throw new AppError('not-found', 'x')
    }).toThrow(AppError)
  })
})
