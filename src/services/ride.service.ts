import { rideRepository } from '@/modules/Api'
import { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class RideService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideEntity[]>> {
    try {
      const { data, pagination } = await rideRepository.getAll(limit, offset)
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(id: string): Promise<ListResponseType<RideEntity> | null> {
    try {
      return await rideRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
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
        `Erro ao buscar ride pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar ride')
    }
  }

  async create(
    ride: Omit<RideEntity, 'id'>
  ): Promise<ListResponseType<RideEntity>> {
    try {
      return await rideRepository.create(ride)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    ride: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity>> {
    try {
      return await rideRepository.update(id, ride)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await rideRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
