import { rideRateRepository } from '@/modules/Api'
import { RideRateEntity } from '@/core/entities/RideRate'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class RideRateService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideRateEntity[]>> {
    try {
      const { data, pagination } = await rideRateRepository.getAll(
        limit,
        offset
      )
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(id: string): Promise<ListResponseType<RideRateEntity> | null> {
    try {
      return await rideRateRepository.getById(id)
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
        `Erro ao buscar rideRate pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar rideRate')
    }
  }

  async create(
    rideRate: Omit<RideRateEntity, 'id'>
  ): Promise<ListResponseType<RideRateEntity>> {
    try {
      return await rideRateRepository.create(rideRate)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    rideRate: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity>> {
    try {
      return await rideRateRepository.update(id, rideRate)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await rideRateRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
