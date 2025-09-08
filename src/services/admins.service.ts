import { adminRepository } from '@/modules/Api'
import { AdminEntity } from '@/core/entities/Admin'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class AdminService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminEntity[]>> {
    try {
      const { data, pagination } = await adminRepository.getAll(limit, offset)
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(id: string): Promise<ListResponseType<AdminEntity> | null> {
    try {
      return await adminRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
    }
  }

  async create(
    admin: Omit<AdminEntity, 'id'>
  ): Promise<ListResponseType<AdminEntity>> {
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

  async update(
    id: string,
    admin: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity>> {
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
