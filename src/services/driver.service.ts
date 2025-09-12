// services/drivers.service.ts
import { driverRepository } from '@/modules/Api'
import { DriverEntity } from '@/core/entities/Driver'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class DriverService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DriverEntity>
  ): Promise<ListResponseType<DriverEntity[]>> {
    try {
      return await driverRepository.getAll(limit, offset, searchTerm, filters)
    } catch (error: any) {
      console.error('Erro ao buscar motoristas:', error)
      throw new Error(error.message || 'Erro ao buscar motoristas')
    }
  }

  async getById(id: string): Promise<DriverEntity | null> {
    try {
      return await driverRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar motorista ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar motorista')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DriverEntity[]>> {
    try {
      const { data, pagination } = await driverRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar motorista pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar motorista')
    }
  }

  async getByEmail(email: string): Promise<DriverEntity | null> {
    try {
      return await driverRepository.getByEmail(email)
    } catch (error: any) {
      console.error(`Erro ao buscar motorista ${email}:`, error)
      throw new Error(error.message || 'Erro ao buscar motorista')
    }
  }

  async create(driver: Omit<DriverEntity, 'id'>): Promise<DriverEntity> {
    if (!driver.name || !driver.email) {
      throw new Error('Nome e email são obrigatórios')
    }

    try {
      return await driverRepository.create(driver)
    } catch (error: any) {
      console.error('Erro ao criar motorista:', error)
      throw new Error(error.message || 'Erro ao criar motorista')
    }
  }

  async update(
    id: string,
    driver: Partial<DriverEntity>
  ): Promise<DriverEntity> {
    try {
      return await driverRepository.update(id, driver)
    } catch (error: any) {
      console.error(`Erro ao atualizar motorista ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar motorista')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await driverRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar motorista ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar motorista')
    }
  }
}
