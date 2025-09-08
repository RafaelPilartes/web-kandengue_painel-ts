import { userRepository } from '@/modules/Api'
import { UserEntity } from '@/core/entities/User'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class UserService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<UserEntity[]>> {
    try {
      const { data, pagination } = await userRepository.getAll(limit, offset)
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(id: string): Promise<ListResponseType<UserEntity> | null> {
    try {
      return await userRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  async create(
    user: Omit<UserEntity, 'id'>
  ): Promise<ListResponseType<UserEntity>> {
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

  async update(
    id: string,
    user: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity>> {
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
}
