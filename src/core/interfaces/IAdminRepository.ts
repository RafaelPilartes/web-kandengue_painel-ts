// core/interfaces/IAdminRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { AdminEntity } from '../entities/Admin'

export interface IAdminRepository extends IBaseRepository<AdminEntity> {
  /** Atalho de leitura — o motor já sabe procurar por campo. */
  getByEmail(email: string): Promise<AdminEntity | null>
}
