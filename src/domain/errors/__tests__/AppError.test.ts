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

// ── Códigos do Firebase Auth ──
// A tabela só cobria códigos do Firestore. Um login falhado saía sempre como
// "Ocorreu um erro inesperado.", e o utilizador não sabia se tinha errado a
// senha, se a conta estava desactivada, ou se a internet tinha caído.
describe('toAppError — erros de autenticação', () => {
  const casos: Array<[string, string]> = [
    ['auth/invalid-credential', 'E-mail ou senha incorretos.'],
    ['auth/wrong-password', 'E-mail ou senha incorretos.'],
    ['auth/user-not-found', 'E-mail ou senha incorretos.'],
    ['auth/invalid-email', 'E-mail inválido.'],
    ['auth/user-disabled', 'Esta conta foi desactivada.'],
    ['auth/too-many-requests', 'Demasiadas tentativas. Tente mais tarde.'],
    ['auth/network-request-failed', 'Sem ligação. Verifique a internet e tente novamente.'],
    ['auth/email-already-in-use', 'Este e-mail já está em uso.'],
    ['auth/weak-password', 'A senha é demasiado fraca.'],
    ['auth/requires-recent-login', 'Por segurança, inicie sessão novamente antes de repetir.']
  ]

  it.each(casos)('%s → mensagem própria', (code, esperado) => {
    const erro = toAppError({ code })
    expect(erro.message).toBe(esperado)
    expect(erro.code).not.toBe('unknown')
  })

  it('mantém o contexto à frente da mensagem', () => {
    expect(toAppError({ code: 'auth/invalid-credential' }, '[AuthUseCase.login]').message).toBe(
      '[AuthUseCase.login] E-mail ou senha incorretos.'
    )
  })

  it('um código de auth desconhecido continua a cair em unknown', () => {
    expect(toAppError({ code: 'auth/coisa-nova' }).code).toBe('unknown')
  })

  it('não confunde um código de Firestore com um de auth', () => {
    expect(toAppError({ code: 'permission-denied' }).message).toBe(
      'Não tem permissão para esta operação.'
    )
  })
})
