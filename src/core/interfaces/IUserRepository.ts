// core/interfaces/IUserRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { UserEntity } from '../entities/User'

export interface IUserRepository extends IBaseRepository<UserEntity> {
  /** Atalho de leitura — o motor já sabe procurar por campo. */
  getByEmail(email: string): Promise<UserEntity | null>
  /**
   * Marca `status: 'deleted'` sem apagar o documento. Se `firebaseUid` for o
   * do utilizador com sessão iniciada, apaga também a conta no Firebase Auth
   * — no painel só dispara se um admin se apagar a si próprio.
   */
  softDelete(id: string, firebaseUid?: string): Promise<void>
}
