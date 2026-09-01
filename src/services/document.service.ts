// services/documents.service.ts
import { documentRepository } from '@/modules/Api'
import { DocumentEntity } from '@/core/entities/Document'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

/**
 * Traduz `offset` (paginação por número de registos saltados, como o DAO
 * antigo fazia) para o cursor por `id` que o `BaseFirebaseDAO` espera.
 * Mesmo custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<DocumentEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await documentRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class DocumentService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DocumentEntity>
  ): Promise<ListResponseType<DocumentEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await documentRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
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

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<DocumentEntity | null> {
    try {
      return await documentRepository.getOneByField(
        field as keyof DocumentEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar document por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar document')
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
      const filters = { [field]: value } as Partial<DocumentEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await documentRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

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
