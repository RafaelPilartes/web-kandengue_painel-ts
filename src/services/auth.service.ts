import { auth } from '@/config/firebase.config'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import type { UserCredential } from 'firebase/auth'

export class AuthService {
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
}
