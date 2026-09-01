// services/admins.service.ts
import { adminRepository } from '@/modules/Api'
import { AdminEntity } from '@/core/entities/Admin'
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
  base: Omit<QueryOptions<AdminEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await adminRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class AdminService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await adminRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar admins:', error)
      throw new Error(error.message || 'Erro ao buscar admins')
    }
  }

  async getById(id: string): Promise<AdminEntity | null> {
    try {
      return await adminRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  async getByEmail(email: string): Promise<AdminEntity | null> {
    try {
      return await adminRepository.getByEmail(email)
    } catch (error: any) {
      console.error(`Erro ao buscar admin ${email}:`, error)
      throw new Error(error.message || 'Erro ao buscar admin')
    }
  }

  // get one by custom field
  async getOneByField(field: string, value: any): Promise<AdminEntity | null> {
    try {
      return await adminRepository.getOneByField(
        field as keyof AdminEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar admin por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar admin')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminEntity[]>> {
    try {
      const filters = { [field]: value } as Partial<AdminEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await adminRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar admin pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar admin')
    }
  }

  async create(admin: Omit<AdminEntity, 'id'>): Promise<AdminEntity> {
    if (!admin.name || !admin.email) {
      throw new Error('Nome e email são obrigatórios')
    }

    try {
      return await adminRepository.create(admin)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(id: string, admin: Partial<AdminEntity>): Promise<AdminEntity> {
    try {
      return await adminRepository.update(id, admin)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await adminRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
