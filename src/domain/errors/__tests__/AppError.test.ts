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

  it('guarda o contexto à parte, fora da mensagem', () => {
    // Antes o contexto ia à frente da mensagem, e chegava ao ecrã:
    // `Erro mapeado: "[AuthUseCase.login] E-mail ou senha incorretos."`.
    // A mensagem é para o utilizador; o contexto é para quem diagnostica.
    const err = toAppError(
      { code: 'firestore/not-found' },
      '[vehicles.getById]'
    )

    expect(err.message).toBe('Registo não encontrado.')
    expect(err.context).toBe('[vehicles.getById]')
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
  const cases: Array<[string, string]> = [
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

  it.each(cases)('%s → mensagem própria', (code, expected) => {
    const error = toAppError({ code })
    expect(error.message).toBe(expected)
    expect(error.code).not.toBe('unknown')
  })

  it('o contexto fica fora da mensagem que o utilizador lê', () => {
    const error = toAppError({ code: 'auth/invalid-credential' }, '[AuthUseCase.login]')

    // O que aparece no ecrã: limpo.
    expect(error.message).toBe('E-mail ou senha incorretos.')
    // O que serve para diagnosticar: à parte.
    expect(error.context).toBe('[AuthUseCase.login]')
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
