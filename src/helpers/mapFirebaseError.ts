import { mapFirebaseError as translate } from '@rafaelpilartes/kandengue-shared/functions'
import { AppError } from '@/domain/errors/AppError'

/**
 * Erros do Firebase, traduzidos — com os dois casos que so o painel tem.
 *
 * A tabela dos 46 codigos vive agora na lib partilhada, identica a das
 * apps. Aqui ficam so as duas coisas que sao mesmo do painel e que nao
 * pertencem a uma biblioteca: a classe `AppError` da arquitectura dele, e
 * o caso de alguem passar `err.message` em vez de `err`.
 *
 * ── O que a lib corrigiu de caminho ──
 * O `default` daqui devolvia `Erro mapeado: ${error.message}` — o texto
 * cru da Google direito ao ecra. Os `AppError` nunca la chegavam, por isso
 * os testes nao o apanhavam; tudo o resto chegava.
 */
export function mapFirebaseError(error: any): string {
  // Um `AppError` ja vem traduzido pelo `toAppError` dos usecases. Mapea-lo
  // outra vez so o embrulharia — era assim que o ecra de login mostrava
  // `Erro mapeado: "[AuthUseCase.login] E-mail ou senha incorretos."`.
  if (error instanceof AppError) return error.message

  // Uma string ja e uma mensagem; nao tem `code` para mapear. Chega aqui
  // quando o chamador passa `err.message` em vez de `err`.
  if (typeof error === 'string') return error

  return translate(error)
}
