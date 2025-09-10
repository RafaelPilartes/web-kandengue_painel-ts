import { rideTrackingRepository } from '@/modules/Api'
import { RideTrackingEntity } from '@/core/entities/RideTracking'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class RideTrackingService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    try {
      const { data, pagination } = await rideTrackingRepository.getAll(
        limit,
        offset
      )
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(
    id: string
  ): Promise<ListResponseType<RideTrackingEntity> | null> {
    try {
      return await rideTrackingRepository.getById(id)
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
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    try {
      const { data, pagination } = await rideTrackingRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar rideTracking pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar rideTracking')
    }
  }

  async create(
    rideTracking: Omit<RideTrackingEntity, 'id'>
  ): Promise<ListResponseType<RideTrackingEntity>> {
    try {
      return await rideTrackingRepository.create(rideTracking)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    rideTracking: Partial<RideTrackingEntity>
  ): Promise<ListResponseType<RideTrackingEntity>> {
    try {
      return await rideTrackingRepository.update(id, rideTracking)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await rideTrackingRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
