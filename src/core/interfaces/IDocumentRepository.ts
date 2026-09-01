// core/interfaces/IDocumentRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { DocumentEntity } from '../entities/Document'

export interface IDocumentRepository
  extends IBaseRepository<DocumentEntity> {}
