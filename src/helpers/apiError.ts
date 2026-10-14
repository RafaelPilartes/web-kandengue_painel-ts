import type { MissingRequirement } from '@/core/interfaces/IAdminDriverRepository'

/**
 * O erro da API, com o contrato da 3.1 preservado.
 *
 * ── Porque existe ──
 * O `Api.dao.ts` embrulhava tudo num `new Error(data.message)`: o `code` e o
 * `details` da resposta **morriam ali**. Para a maior parte das rotas isso
 * bastava — o painel só mostrava a frase. Deixou de bastar na 3.7: quando a
 * aprovação de um serviço é recusada, **o que falta vem no `details`**, e é
 * isso que o admin precisa de ver em vez de um 'requisitos não cumpridos'.
 *
 * O contrato (§0A, Fase 3): `code` é estável e é por ele que se decide;
 * `user_message` só existe nos erros de **negócio** e é o único texto que se
 * mostra tal e qual. As validações e os erros técnicos **não a levam** — e aí
 * o painel escolhe a sua frase, porque a `message` deles é diagnóstico para
 * quem desenvolve.
 */
export class ApiError extends Error {
  /*
   * Campos declarados e atribuídos à mão: o `tsconfig` do painel corre com
   * `erasableSyntaxOnly`, e os parâmetros-propriedade do TypeScript não
   * passam por lá (é sintaxe que não se apaga só com os tipos).
   */
  readonly status: number | null
  readonly code: string | null
  readonly userMessage: string | null
  readonly details: unknown

  constructor(
    message: string,
    status: number | null,
    code: string | null,
    userMessage: string | null,
    details: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.userMessage = userMessage
    this.details = details
  }
}

/**
 * O que se mostra a um administrador.
 *
 * ⚠️ **Nunca a `message` de uma validação ou de um erro técnico.** É a lição
 * do §0A: foi por esse caminho que `body/code Code must contain only A-Z…`
 * chegou ao ecrã de um passageiro. Um administrador tolera mais diagnóstico
 * do que um passageiro — mas 'Unknown error' e `body/service Invalid enum
 * value` também não lhe dizem nada, e escondem o que ele podia resolver.
 *
 * A ordem: a `user_message` do negócio; senão uma frase por estado; senão a
 * genérica. O texto técnico fica no `console`, não no ecrã.
 */
export function mapApiError(
  erro: unknown,
  generica = 'Não foi possível concluir a operação.'
): string {
  if (!(erro instanceof ApiError)) {
    return erro instanceof Error && erro.message ? erro.message : generica
  }

  if (erro.userMessage) return erro.userMessage

  switch (erro.status) {
    case 400:
    case 422:
      return 'O pedido não foi aceite pelo servidor. Confirma os dados e tenta de novo.'
    case 401:
      return 'A tua sessão expirou. Entra outra vez.'
    case 403:
      return 'Não tens permissão para esta operação.'
    case 404:
      return 'Não encontrado.'
    case 409:
      return 'O estado mudou entretanto. Recarrega e tenta de novo.'
    case 429:
      return 'Demasiados pedidos. Espera um instante.'
    case null:
      return 'Sem resposta do servidor. Verifica a ligação.'
    default:
      return erro.status && erro.status >= 500
        ? 'O servidor falhou. Tenta de novo dentro de um momento.'
        : generica
  }
}

/**
 * Os requisitos em falta que a API devolve numa recusa de serviço (3.7).
 *
 * Lê o `details` de um `ApiError` com `code: 'SERVICE_REQUIREMENTS_NOT_MET'`
 * e devolve a lista; para qualquer outro erro devolve vazio. **Não inventa
 * nada** — se o `details` vier com outra forma (uma versão da API mais nova
 * do que este painel), devolve vazio e quem chama mostra a frase da API.
 */
export function missingRequirements(erro: unknown): MissingRequirement[] {
  if (!(erro instanceof ApiError)) return []
  if (erro.code !== 'SERVICE_REQUIREMENTS_NOT_MET') return []

  const d = erro.details as { missing?: unknown } | null
  const lista = Array.isArray(d?.missing) ? d.missing : null
  if (!lista) return []

  return lista.filter(
    (r): r is MissingRequirement =>
      !!r &&
      typeof r === 'object' &&
      typeof (r as MissingRequirement).key === 'string' &&
      typeof (r as MissingRequirement).label === 'string'
  )
}

/**
 * Tira a marcação de markdown de um texto que vai para um `<span>`.
 *
 * ⚠️ **A API escreve ênfase em markdown**, e com razão: os mesmos textos vão
 * para logs, para o HANDOFF e para respostas HTTP (`"aprovado mas
 * **caducado**"`). O painel rende-os como texto simples, por isso o admin lia
 * literalmente `aprovado mas **caducado**` — achado pela revisão independente
 * da Fase 4.
 *
 * Tira em vez de interpretar: um renderizador de markdown num campo que vem
 * do servidor é uma superfície que não se quer (e uma dependência a mais para
 * dois asteriscos). O que se perde é a ênfase; o que se ganha é a frase
 * legível.
 */
export function semMarcacao(texto: string): string {
  return texto
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
}
