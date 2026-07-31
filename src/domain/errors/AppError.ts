export type AppErrorCode =
  | 'permission-denied'
  | 'not-found'
  | 'already-exists'
  | 'unavailable'
  | 'failed-precondition'
  | 'unauthenticated'
  | 'unknown'

const MESSAGES: Record<AppErrorCode, string> = {
  'permission-denied': 'Não tem permissão para esta operação.',
  'not-found': 'Registo não encontrado.',
  'already-exists': 'Este registo já existe.',
  unavailable: 'Sem ligação. Verifique a internet e tente novamente.',
  'failed-precondition': 'Consulta inválida — índice em falta.',
  unauthenticated: 'Sessão expirada. Inicie sessão novamente.',
  unknown: 'Ocorreu um erro inesperado.'
}

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly original?: unknown

  constructor(code: AppErrorCode, message: string, original?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.original = original
  }
}

/** Traduz um erro do Firebase para o vocabulário do domínio. */
export function toAppError(err: unknown, context = ''): AppError {
  if (err instanceof AppError) return err

  const raw = (err as { code?: string } | null)?.code ?? ''
  const suffix = raw.includes('/') ? raw.split('/')[1] : raw
  const code: AppErrorCode =
    suffix in MESSAGES ? (suffix as AppErrorCode) : 'unknown'

  if (code === 'failed-precondition') {
    // O Firestore devolve o URL de criação do índice dentro da mensagem.
    console.error(`${context} índice em falta:`, (err as Error)?.message)
  }

  const message = context ? `${context} ${MESSAGES[code]}` : MESSAGES[code]
  return new AppError(code, message, err)
}
