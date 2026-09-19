export type AppErrorCode =
  // Firestore
  | 'permission-denied'
  | 'not-found'
  | 'already-exists'
  | 'unavailable'
  | 'failed-precondition'
  | 'unauthenticated'
  // Firebase Auth — o prefixo `auth/` é descascado em `toAppError`
  | 'invalid-credential'
  | 'wrong-password'
  | 'user-not-found'
  | 'invalid-email'
  | 'user-disabled'
  | 'too-many-requests'
  | 'network-request-failed'
  | 'email-already-in-use'
  | 'weak-password'
  | 'requires-recent-login'
  | 'unknown'

const MESSAGES: Record<AppErrorCode, string> = {
  'permission-denied': 'Não tem permissão para esta operação.',
  'not-found': 'Registo não encontrado.',
  'already-exists': 'Este registo já existe.',
  unavailable: 'Sem ligação. Verifique a internet e tente novamente.',
  'failed-precondition': 'Consulta inválida — índice em falta.',
  unauthenticated: 'Sessão expirada. Inicie sessão novamente.',

  // `invalid-credential` é o que o Firebase devolve hoje para senha errada
  // E para conta inexistente — de propósito, para não revelar se o e-mail
  // existe. As três partilham a mensagem pela mesma razão.
  'invalid-credential': 'E-mail ou senha incorretos.',
  'wrong-password': 'E-mail ou senha incorretos.',
  'user-not-found': 'E-mail ou senha incorretos.',
  'invalid-email': 'E-mail inválido.',
  'user-disabled': 'Esta conta foi desactivada.',
  'too-many-requests': 'Demasiadas tentativas. Tente mais tarde.',
  'network-request-failed':
    'Sem ligação. Verifique a internet e tente novamente.',
  'email-already-in-use': 'Este e-mail já está em uso.',
  'weak-password': 'A senha é demasiado fraca.',
  'requires-recent-login':
    'Por segurança, inicie sessão novamente antes de repetir.',

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
