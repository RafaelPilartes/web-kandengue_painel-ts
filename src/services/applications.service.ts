// services/applications.service.ts
import { applicationRepository } from '../modules/Api'
import { ApplicationEntity } from '../core/entities/Application'
import type { ListResponseType } from '../interfaces/IApiResponse'

export class ApplicationService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<ApplicationEntity>
  ): Promise<ListResponseType<ApplicationEntity[]>> {
    try {
      return await applicationRepository.getAll(
        limit,
        offset,
        searchTerm,
        filters
      )
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
      return await applicationRepository.getOneByField(field, value)
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
      const { data, pagination } = await applicationRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

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
