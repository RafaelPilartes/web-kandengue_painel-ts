// core/interfaces/IApplicationRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { ApplicationEntity } from '../entities/Application'

export interface IApplicationRepository
  extends IBaseRepository<ApplicationEntity> {
  /** Atalho de leitura — o motor já sabe procurar por campo. */
  getByEmail(email: string): Promise<ApplicationEntity | null>
}
