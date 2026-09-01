// services/users.service.ts
import { userRepository } from '@/modules/Api'
import { UserEntity } from '@/core/entities/User'
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
  base: Omit<QueryOptions<UserEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await userRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class UserService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await userRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar users:', error)
      throw new Error(error.message || 'Erro ao buscar users')
    }
  }

  async getById(id: string): Promise<UserEntity | null> {
    try {
      return await userRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  // get one by custom field
  async getOneByField(field: string, value: any): Promise<UserEntity | null> {
    try {
      return await userRepository.getOneByField(
        field as keyof UserEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar user por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar user')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<UserEntity[]>> {
    try {
      const filters = { [field]: value } as Partial<UserEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await userRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar user pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar user')
    }
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    try {
      return await userRepository.getByEmail(email)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${email}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  async create(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    if (!user.name || !user.email) {
      throw new Error('Nome e email são obrigatórios')
    }

    try {
      return await userRepository.create(user)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
    try {
      return await userRepository.update(id, user)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await userRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }

  async softDelete(id: string, firebaseUid?: string): Promise<void> {
    try {
      return await userRepository.softDelete(id, firebaseUid)
    } catch (error: any) {
      console.error(`Erro ao soft-deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao soft-deletar usuário')
    }
  }
}
