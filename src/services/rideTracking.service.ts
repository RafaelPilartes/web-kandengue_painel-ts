// services/rideTrackings.service.ts
import { rideTrackingRepository } from '@/modules/Api'
import { RideTrackingEntity } from '@/core/entities/RideTracking'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class RideTrackingService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideTrackingEntity>
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    try {
      return await rideTrackingRepository.getAll(
        limit,
        offset,
        searchTerm,
        filters
      )
    } catch (error: any) {
      console.error('Erro ao buscar trajetorias de viagens:', error)
      throw new Error(error.message || 'Erro ao buscar trajetoria de viagem')
    }
  }

  async getById(id: string): Promise<RideTrackingEntity | null> {
    try {
      return await rideTrackingRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar trajetoria de viagem ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar trajetorias de viagens')
    }
  }

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<RideTrackingEntity | null> {
    try {
      return await rideTrackingRepository.getOneByField(field, value)
    } catch (error: any) {
      console.error(`Erro ao buscar rideTracking por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar rideTracking')
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
        `Erro ao buscar trajetoria de viagem pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar trajetoria de viagem')
    }
  }

  async create(
    rideTracking: Omit<RideTrackingEntity, 'id'>
  ): Promise<RideTrackingEntity> {
    try {
      return await rideTrackingRepository.create(rideTracking)
    } catch (error: any) {
      console.error('Erro ao criar trajetoria de viagem:', error)
      throw new Error(error.message || 'Erro ao criar trajetoria de viagem')
    }
  }

  async update(
    id: string,
    rideTracking: Partial<RideTrackingEntity>
  ): Promise<RideTrackingEntity> {
    try {
      return await rideTrackingRepository.update(id, rideTracking)
    } catch (error: any) {
      console.error(`Erro ao atualizar trajetoria de viagem ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar trajetoria de viagem')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await rideTrackingRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar trajetoria de viagem ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar trajetoria de viagem')
    }
  }

  listenByRideId(
    rideId: string,
    onUpdate: (tracking: RideTrackingEntity) => void,
    onError?: (err: Error) => void
  ): () => void {
    return rideTrackingRepository.listenByRideId(rideId, onUpdate, onError)
  }
}
