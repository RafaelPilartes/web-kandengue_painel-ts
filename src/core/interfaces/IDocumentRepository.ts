// core/interfaces/IDocumentRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { DocumentEntity } from '../entities/Document'

export interface IDocumentRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity[]>>
  getById(id: string): Promise<DocumentEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DocumentEntity[]>>
  getOneByField(field: string, value: any): Promise<DocumentEntity | null>
  create(Document: Omit<DocumentEntity, 'id'>): Promise<DocumentEntity>
  update(id: string, Document: Partial<DocumentEntity>): Promise<DocumentEntity>
  delete(id: string): Promise<void>
}
