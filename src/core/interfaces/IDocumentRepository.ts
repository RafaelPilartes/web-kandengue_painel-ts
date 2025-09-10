import type { ListResponseType } from '@/interfaces/IApiResponse'
import { DocumentEntity } from '../entities/Document'

export interface IDocumentRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DocumentEntity[]>>
  getById(id: string): Promise<ListResponseType<DocumentEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DocumentEntity[]>>
  create(
    Document: Omit<DocumentEntity, 'id'>
  ): Promise<ListResponseType<DocumentEntity>>
  update(
    id: string,
    Document: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity>>
  delete(id: string): Promise<void>
}
