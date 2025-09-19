import { extractFirebaseCode } from './extractFirebaseCode'

export function mapFirebaseError(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.'

  const errorCode = extractFirebaseCode(error)

  switch (errorCode) {
    /**
     * 🔹 AUTH ERRORS
     */
    case 'auth/invalid-email':
      return 'E-mail inválido'
    case 'auth/email-already-in-use':
      return 'Este e-mail já está em uso'
    case 'auth/user-disabled':
      return 'Esta conta foi desativada'
    case 'auth/user-not-found':
      return 'Usuário não encontrado'
    case 'auth/wrong-password':
      return 'Senha incorreta'
    case 'auth/weak-password':
      return 'A senha é muito fraca'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde e tente novamente'
    case 'auth/network-request-failed':
      return 'Falha na rede. Verifique sua internet'
    case 'auth/invalid-credential':
      return 'Credenciais inválidas'
    case 'auth/missing-password':
      return 'Senha não informada'

    /**
     * 🔹 FIRESTORE ERRORS
     */
    case 'permission-denied':
      return 'Sem permissão para acessar este recurso'
    case 'unavailable':
      return 'Serviço indisponível. Tente novamente mais tarde'
    case 'not-found':
      return 'Documento não encontrado'
    case 'already-exists':
      return 'O recurso já existe'
    case 'cancelled':
      return 'Operação cancelada'
    case 'deadline-exceeded':
      return 'Tempo limite excedido'
    case 'resource-exhausted':
      return 'Limite de recurso atingido'
    case 'failed-precondition':
      return 'Pré-condições não atendidas'
    case 'aborted':
      return 'Operação abortada'
    case 'out-of-range':
      return 'Valor fora do intervalo permitido'
    case 'internal':
      return 'Erro interno no servidor'
    case 'data-loss':
      return 'Perda irreparável de dados'
    case 'unauthenticated':
      return 'Usuário não autenticado'

    /**
     * 🔹 REALTIME DATABASE ERRORS
     */
    case 'database/permission-denied':
      return 'Sem permissão para acessar os dados'
    case 'database/expired-token':
      return 'Sessão expirada, faça login novamente'
    case 'database/invalid-token':
      return 'Token inválido'
    case 'database/network-error':
      return 'Erro de rede ao acessar a base de dados'

    /**
     * 🔹 STORAGE ERRORS
     */
    case 'storage/unauthorized':
      return 'Sem permissão para acessar o arquivo'
    case 'storage/canceled':
      return 'Upload ou download cancelado'
    case 'storage/unknown':
      return 'Erro desconhecido no armazenamento'
    case 'storage/object-not-found':
      return 'Arquivo não encontrado'
    case 'storage/quota-exceeded':
      return 'Limite de armazenamento atingido'
    case 'storage/retry-limit-exceeded':
      return 'Limite de tentativas excedido'
    case 'storage/invalid-checksum':
      return 'Arquivo corrompido. Verifique o upload'

    /**
     * 🔹 FUNCTIONS ERRORS
     */
    case 'functions/invalid-argument':
      return 'Argumento inválido enviado para a função'
    case 'functions/failed-precondition':
      return 'Pré-condições não atendidas para executar a função'
    case 'functions/out-of-range':
      return 'Parâmetro fora do intervalo permitido'
    case 'functions/unavailable':
      return 'Função temporariamente indisponível'
    case 'functions/internal':
      return 'Erro interno da função'
    case 'functions/deadline-exceeded':
      return 'A função demorou muito para responder'

    default:
      return `Erro inesperado. Tente novamente: ${error}`
  }
}
