// core/interfaces/IDriverRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { DriverEntity } from '../entities/Driver'

export interface IDriverRepository extends IBaseRepository<DriverEntity> {
  /** Atalho de leitura — o motor já sabe procurar por campo. */
  getByEmail(email: string): Promise<DriverEntity | null>
  /**
   * Marca `status: 'deleted'` sem apagar o documento. Se `firebaseUid` for o
   * do utilizador com sessão iniciada, apaga também a conta no Firebase Auth.
   */
  softDelete(id: string, firebaseUid?: string): Promise<void>
  /** Escuta em tempo real os motoristas online. */
  listenOnlineDrivers(
    onUpdate: (drivers: DriverEntity[]) => void,
    onError?: (err: Error) => void
  ): () => void
}
