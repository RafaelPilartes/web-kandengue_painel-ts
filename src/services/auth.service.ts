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

export class AuthService {
  /** 🔹 Login */
  async login(email: string, password: string): Promise<UserCredential> {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios')
    }

    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error('Erro no login:', error)
      throw new Error(error.message || 'Falha ao fazer login')
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error('Erro no logout:', error)
      throw new Error(error.message || 'Falha ao sair')
    }
  }

  /** 🔹 Registrar novo usuário */
  async register(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserCredential> {
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
  }

  /** 🔹 Resetar senha por email */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error)
      throw new Error(error.message || 'Falha ao enviar reset de senha')
    }
  }

  /** 🔹 Alterar senha logado */
  async changePassword(newPassword: string): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error('Usuário não autenticado')

    try {
      await updatePassword(user, newPassword)
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error)
      throw new Error(error.message || 'Falha ao alterar senha')
    }
  }

  /** 🔹 Retorna usuário atual */
  getCurrentUser(): User | null {
    return auth.currentUser
  }

  /** 🔹 Listener para mudanças no estado da auth */
  onAuthChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  }
}
