import { describe, expect, it } from 'vitest'
import { mapFirebaseError } from '../mapFirebaseError'
import { AppError, toAppError } from '@/domain/errors/AppError'

// Há dois tradutores de erro no projecto: o `toAppError` dos usecases e este
// `mapFirebaseError`, que os ecrãs chamam. Quando os dois corriam em cima um
// do outro, o utilizador via:
//
//   Erro mapeado: "[AuthUseCase.login] E-mail ou senha incorretos."
//
// — a mensagem certa, embrulhada duas vezes e com o contexto interno à vista.
describe('mapFirebaseError não re-traduz o que já vem traduzido', () => {
  it('deixa passar um AppError intacto', () => {
    const error = toAppError({ code: 'auth/invalid-credential' }, '[AuthUseCase.login]')

    expect(mapFirebaseError(error)).toBe('E-mail ou senha incorretos.')
  })

  it('não deixa escapar o contexto para o ecrã', () => {
    const error = toAppError({ code: 'auth/invalid-credential' }, '[AuthUseCase.login]')
    const shown = mapFirebaseError(error)

    expect(shown).not.toContain('AuthUseCase')
    expect(shown).not.toContain('Erro mapeado')
  })

  it('uma string já é uma mensagem — devolve-a tal e qual', () => {
    // O ecrã de login passava `err.message` em vez de `err`. Sem `code`,
    // caía no ramo genérico e o JSON.stringify punha-lhe aspas.
    expect(mapFirebaseError('Qualquer coisa correu mal')).toBe(
      'Qualquer coisa correu mal'
    )
  })

  it('continua a traduzir um erro cru do Firebase', () => {
    expect(mapFirebaseError({ code: 'auth/user-disabled' })).not.toContain(
      'Erro mapeado'
    )
  })

  it('sem erro nenhum, devolve a mensagem genérica', () => {
    expect(mapFirebaseError(null)).toBe('Ocorreu um erro inesperado. Tente novamente.')
  })

  it('um AppError construído à mão também passa', () => {
    expect(mapFirebaseError(new AppError('not-found', 'Registo não encontrado.'))).toBe(
      'Registo não encontrado.'
    )
  })
})
