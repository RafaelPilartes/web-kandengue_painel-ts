// Casca de compatibilidade — a lógica real vive em
// `@/domain/usecases/authUseCase`. Este ficheiro sobrevive só porque
// `src/hooks/__tests__/useAuthSessionSync.test.ts` mocka o caminho
// `@/services/auth.service` directamente (intercepta a classe `AuthService`,
// não uma função exportada), e esse teste não pode ser alterado. Mudar o
// `useAuthSessionSync` para importar o usecase directamente faz o teste
// falhar, porque o mock deixa de ser intercetado — verificado empiricamente.
//
// Não acrescentar lógica aqui. Cada método delega directo ao usecase.
import { authUseCase } from '@/domain/usecases/authUseCase'
import type { User, UserCredential } from 'firebase/auth'

export class AuthService {
  login(email: string, password: string): Promise<UserCredential> {
    return authUseCase.executeLogin(email, password)
  }

  logout(): Promise<void> {
    return authUseCase.executeLogout()
  }

  register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserCredential> {
    return authUseCase.executeRegister(email, password, displayName)
  }

  resetPassword(email: string): Promise<void> {
    return authUseCase.executeResetPassword(email)
  }

  changePassword(newPassword: string): Promise<void> {
    return authUseCase.executeChangePassword(newPassword)
  }

  getCurrentUser(): User | null {
    return authUseCase.executeGetCurrentUser()
  }

  onAuthChanged(callback: (user: User | null) => void): () => void {
    return authUseCase.executeOnAuthChanged(callback)
  }
}
