// services/rideRates.service.ts
import { rideRateRepository } from '@/modules/Api'
import { RideRateEntity } from '@/core/entities/RideRate'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class RideRateService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity[]>> {
    try {
      return await rideRateRepository.getAll(limit, offset, searchTerm, filters)
    } catch (error: any) {
      console.error('Erro ao buscar taxa de viagem:', error)
      throw new Error(error.message || 'Erro ao buscar taxa de viagem')
    }
  }

  async getById(id: string): Promise<RideRateEntity | null> {
    try {
      return await rideRateRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar taxa de viagem ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar taxa de viagem')
    }
  }

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<RideRateEntity | null> {
    try {
      return await rideRateRepository.getOneByField(field, value)
    } catch (error: any) {
      console.error(`Erro ao buscar rideRate por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar rideRate')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideRateEntity[]>> {
    try {
      const { data, pagination } = await rideRateRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar taxa de viagem pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar taxa de viagem')
    }
  }

  async create(rideRate: Omit<RideRateEntity, 'id'>): Promise<RideRateEntity> {
    try {
      return await rideRateRepository.create(rideRate)
    } catch (error: any) {
      console.error('Erro ao criar taxa de viagem:', error)
      throw new Error(error.message || 'Erro ao criar taxa de viagem')
    }
  }

  async update(
    id: string,
    rideRate: Partial<RideRateEntity>
  ): Promise<RideRateEntity> {
    try {
      return await rideRateRepository.update(id, rideRate)
    } catch (error: any) {
      console.error(`Erro ao atualizar taxa de viagem ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar taxa de viagem')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await rideRateRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar taxa de viagem ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar taxa de viagem')
    }
  }
}
