// services/rides.service.ts
import { rideRepository } from '@/modules/Api'
import { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class RideService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity[]>> {
    try {
      return await rideRepository.getAll(limit, offset, searchTerm, filters)
    } catch (error: any) {
      console.error('Erro ao buscar corrida:', error)
      throw new Error(error.message || 'Erro ao buscar corrida')
    }
  }

  async getById(id: string): Promise<RideEntity | null> {
    try {
      return await rideRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar corrida ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar corrida')
    }
  }

  // get one by custom field
  async getOneByField(field: string, value: any): Promise<RideEntity | null> {
    try {
      return await rideRepository.getOneByField(field, value)
    } catch (error: any) {
      console.error(`Erro ao buscar ride por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar ride')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideEntity[]>> {
    try {
      const { data, pagination } = await rideRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar corrida pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar corrida')
    }
  }

  async create(ride: Omit<RideEntity, 'id'>): Promise<RideEntity> {
    try {
      return await rideRepository.create(ride)
    } catch (error: any) {
      console.error('Erro ao criar corrida:', error)
      throw new Error(error.message || 'Erro ao criar corrida')
    }
  }

  async update(id: string, ride: Partial<RideEntity>): Promise<RideEntity> {
    try {
      return await rideRepository.update(id, ride)
    } catch (error: any) {
      console.error(`Erro ao atualizar corrida ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar corrida')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await rideRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar corrida ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar corrida')
    }
  }
}
