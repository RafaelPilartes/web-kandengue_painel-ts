// services/applications.service.ts
import { applicationRepository } from '@/modules/Api'
import { ApplicationEntity } from '@/core/entities/Application'
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
  base: Omit<QueryOptions<ApplicationEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await applicationRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class ApplicationService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<ApplicationEntity>
  ): Promise<ListResponseType<ApplicationEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await applicationRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar applications:', error)
      throw new Error(error.message || 'Erro ao buscar applications')
    }
  }

  async getById(id: string): Promise<ApplicationEntity | null> {
    try {
      return await applicationRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<ApplicationEntity | null> {
    try {
      return await applicationRepository.getOneByField(
        field as keyof ApplicationEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar application por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar application')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<ApplicationEntity[]>> {
    try {
      const filters = { [field]: value } as Partial<ApplicationEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await applicationRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar application pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar application')
    }
  }

  async getByEmail(email: string): Promise<ApplicationEntity | null> {
    try {
      return await applicationRepository.getByEmail(email)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${email}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  async create(
    application: Omit<ApplicationEntity, 'id'>
  ): Promise<ApplicationEntity> {
    if (
      !application.first_name ||
      !application.last_name ||
      !application.email
    ) {
      throw new Error('Nome, sobrenome e email são obrigatórios')
    }

    try {
      return await applicationRepository.create(application)
    } catch (error: any) {
      console.error('Erro ao criar candidatura:', error)
      throw new Error(error.message || 'Erro ao criar candidatura')
    }
  }

  async update(
    id: string,
    application: Partial<ApplicationEntity>
  ): Promise<ApplicationEntity> {
    try {
      return await applicationRepository.update(id, application)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await applicationRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
