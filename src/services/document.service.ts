// services/documents.service.ts
import { documentRepository } from '@/modules/Api'
import { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class DocumentService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity[]>> {
    try {
      return await documentRepository.getAll(limit, offset, searchTerm, filters)
    } catch (error: any) {
      console.error('Erro ao buscar documentos:', error)
      throw new Error(error.message || 'Erro ao buscar documentos')
    }
  }

  async getById(id: string): Promise<DocumentEntity | null> {
    try {
      return await documentRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar documento ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar documento')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DocumentEntity[]>> {
    try {
      const { data, pagination } = await documentRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar documento pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar documento')
    }
  }

  async create(document: Omit<DocumentEntity, 'id'>): Promise<DocumentEntity> {
    try {
      return await documentRepository.create(document)
    } catch (error: any) {
      console.error('Erro ao criar documento:', error)
      throw new Error(error.message || 'Erro ao criar documento')
    }
  }

  async update(
    id: string,
    document: Partial<DocumentEntity>
  ): Promise<DocumentEntity> {
    try {
      return await documentRepository.update(id, document)
    } catch (error: any) {
      console.error(`Erro ao atualizar documento ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar documento')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await documentRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar documento ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar documento')
    }
  }
}
