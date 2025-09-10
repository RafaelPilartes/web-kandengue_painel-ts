import { documentRepository } from '@/modules/Api'
import { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class DocumentService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DocumentEntity[]>> {
    try {
      const { data, pagination } = await documentRepository.getAll(
        limit,
        offset
      )
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(id: string): Promise<ListResponseType<DocumentEntity> | null> {
    try {
      return await documentRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
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
        `Erro ao buscar document pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar document')
    }
  }

  async create(
    document: Omit<DocumentEntity, 'id'>
  ): Promise<ListResponseType<DocumentEntity>> {
    try {
      return await documentRepository.create(document)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    document: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity>> {
    try {
      return await documentRepository.update(id, document)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await documentRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
