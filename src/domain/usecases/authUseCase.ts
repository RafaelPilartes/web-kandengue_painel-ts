import { auth } from '@/config/firebase.config'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile
} from 'firebase/auth'
import type { User, UserCredential } from 'firebase/auth'
import { BaseUseCase } from './BaseUseCase'

/**
 * Fachada sobre o Firebase Auth — não tem repositório, por isso não passa
 * pelo `ApiRepository`. Os cinco métodos assíncronos passam pelo `run()`
 * como qualquer usecase; `executeGetCurrentUser` e `executeOnAuthChanged`
 * são a excepção documentada no plano: um é síncrono, o outro devolve uma
 * subscrição, e nenhum dos dois é "uma operação assíncrona que devolve
 * valor" — que é para o que o `run()` serve.
 */
export class AuthUseCase extends BaseUseCase {
  protected readonly context = 'AuthUseCase'

  /** Login */
  executeLogin(email: string, password: string): Promise<UserCredential> {
    return this.run('login', async () => {
      if (!email || !password) {
        throw new Error('E-mail e senha são obrigatórios')
      }

      try {
        return await signInWithEmailAndPassword(auth, email, password)
      } catch (error: any) {
        console.error('Erro no login:', error)
        throw new Error(error.message || 'Falha ao fazer login')
      }
    })
  }

  executeLogout(): Promise<void> {
    return this.run('logout', async () => {
      try {
        await signOut(auth)
      } catch (error: any) {
        console.error('Erro no logout:', error)
        throw new Error(error.message || 'Falha ao sair')
      }
    })
  }

  /** Regista novo utilizador e, se indicado, define o displayName no perfil. */
  executeRegister(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserCredential> {
    return this.run('register', async () => {
      if (!email || !password) {
        throw new Error('E-mail e senha são obrigatórios')
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )

        // Se quiser adicionar um nome
        if (displayName) {
          await updateProfile(userCredential.user, { displayName })
        }

        return userCredential
      } catch (error: any) {
        console.error('Erro no registro:', error)
        throw new Error(error.message || 'Falha ao registrar usuário')
      }
    })
  }

  /** Reseta senha por email */
  executeResetPassword(email: string): Promise<void> {
    return this.run('resetPassword', async () => {
      try {
        await sendPasswordResetEmail(auth, email)
      } catch (error: any) {
        console.error('Erro ao resetar senha:', error)
        throw new Error(error.message || 'Falha ao enviar reset de senha')
      }
    })
  }

  /** Altera senha do utilizador com sessão iniciada */
  executeChangePassword(newPassword: string): Promise<void> {
    return this.run('changePassword', async () => {
      const user = auth.currentUser
      if (!user) throw new Error('Usuário não autenticado')

      try {
        await updatePassword(user, newPassword)
      } catch (error: any) {
        console.error('Erro ao alterar senha:', error)
        throw new Error(error.message || 'Falha ao alterar senha')
      }
    })
  }

  /** Síncrono — não passa pelo `run()`, que devolveria um Promise. */
  executeGetCurrentUser(): User | null {
    return auth.currentUser
  }

  /**
   * Devolve a subscrição. Não passa pelo `run()` — embrulhar perderia a
   * função de cancelamento, e o hook deixaria o listener pendurado.
   */
  executeOnAuthChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  }
}

export const authUseCase = new AuthUseCase()
