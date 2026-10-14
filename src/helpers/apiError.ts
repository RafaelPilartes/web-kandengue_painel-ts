import type { MissingRequirement } from '@/core/interfaces/IAdminDriverRepository'

/**
 * The API's error, with the 3.1 contract preserved.
 *
 * ── Why this exists ──
 * `Api.dao.ts` used to wrap everything in `new Error(data.message)`: the
 * `code` and the `details` **died right there**. That was enough for most
 * routes — the panel only showed the sentence. It stopped being enough in 3.7:
 * when a service approval is refused, **what is missing comes in `details`**,
 * and that is what the admin needs to see instead of "requirements not met".
 *
 * The contract (§0A, phase 3): `code` is stable and is what decisions are made
 * on; `user_message` only exists on **business** errors and is the only text
 * shown verbatim. Validation and technical errors **do not carry it** — and
 * there the panel picks its own sentence, because their `message` is
 * diagnostics for whoever writes the code.
 */
export class ApiError extends Error {
  /*
   * Fields declared and assigned by hand: the panel's `tsconfig` runs with
   * `erasableSyntaxOnly`, and TypeScript's parameter properties do not pass
   * there (it is syntax that types alone cannot erase).
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
 * What an administrator gets to read.
 *
 * ⚠️ **Never the `message` of a validation or technical error.** That is the
 * §0A lesson: it was through that path that `body/code Code must contain only
 * A-Z…` reached a passenger's screen. An admin tolerates more diagnostics than
 * a passenger — but "Unknown error" and `body/service Invalid enum value` tell
 * them nothing either, and hide what they could have fixed.
 *
 * The order: the business `user_message`; then a sentence per status; then the
 * generic one. Technical text stays in the console, not on the screen.
 *
 * The sentences are user-facing, so they are in Portuguese.
 */
export function mapApiError(
  error: unknown,
  generic = 'Não foi possível concluir a operação.'
): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message ? error.message : generic
  }

  if (error.userMessage) return error.userMessage

  switch (error.status) {
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
      return error.status && error.status >= 500
        ? 'O servidor falhou. Tenta de novo dentro de um momento.'
        : generic
  }
}

/**
 * The missing requirements the API returns when it refuses a service (3.7).
 *
 * Reads the `details` of an `ApiError` whose `code` is
 * `SERVICE_REQUIREMENTS_NOT_MET` and returns the list; for any other error it
 * returns an empty one. **It invents nothing** — if `details` arrives in a
 * different shape (a newer API than this panel), it returns empty and the
 * caller shows the API's sentence instead.
 */
export function missingRequirements(error: unknown): MissingRequirement[] {
  if (!(error instanceof ApiError)) return []
  if (error.code !== 'SERVICE_REQUIREMENTS_NOT_MET') return []

  const d = error.details as { missing?: unknown } | null
  const list = Array.isArray(d?.missing) ? d.missing : null
  if (!list) return []

  return list.filter(
    (r): r is MissingRequirement =>
      !!r &&
      typeof r === 'object' &&
      typeof (r as MissingRequirement).key === 'string' &&
      typeof (r as MissingRequirement).label === 'string'
  )
}

/**
 * Strips markdown emphasis from text that goes into a `<span>`.
 *
 * ⚠️ **The API writes emphasis in markdown**, and rightly so: the same strings
 * go to logs, to the HANDOFF and to HTTP responses (`"aprovado mas
 * **caducado**"`). The panel renders them as plain text, so the admin was
 * literally reading `aprovado mas **caducado**` — found by the independent
 * review of phase 4.
 *
 * It strips rather than interprets: a markdown renderer fed from a server
 * field is a surface we do not want (and a dependency too many for two
 * asterisks). What is lost is the emphasis; what is gained is a readable
 * sentence.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
}
