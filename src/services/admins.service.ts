// services/admins.service.ts
import { adminRepository } from '@/modules/Api'
import { AdminEntity } from '@/core/entities/Admin'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class AdminService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<AdminEntity>
  ): Promise<ListResponseType<AdminEntity[]>> {
    try {
      return await adminRepository.getAll(limit, offset, searchTerm, filters)
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

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<AdminEntity[]>> {
    try {
      const { data, pagination } = await adminRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

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
