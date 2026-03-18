import { rideRepository } from '@/modules/Api'
import { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { MissionService } from './mission.service'

const missionService = new MissionService()

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
      const updatedRide = await rideRepository.update(id, ride)

      // Se a corrida for marcada como 'completed', atualiza o progresso das missões do motorista
      if (ride.status === 'completed' && updatedRide.driver?.id) {
        missionService.updateDriverProgress(updatedRide.driver.id).catch(err => {
          console.error('Erro ao atualizar progresso de missões:', err)
        })
      }

      return updatedRide
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

  listenRideRealtime(
    id: string,
    onUpdate: (ride: RideEntity) => void,
    onError?: (err: Error) => void
  ): () => void {
    try {
      return rideRepository.listenById(id, onUpdate, onError)
    } catch (error: any) {
      console.error(`Erro ao escutar corrida ${id} em tempo real:`, error)
      throw new Error(error.message || 'Erro ao escutar corrida em tempo real')
    }
  }

  listenByField(
    field: keyof RideEntity,
    value: string,
    onUpdate: (ride: RideEntity) => void,
    onError?: (err: Error) => void
  ) {
    try {
      return rideRepository.listenByField(field, value, onUpdate, onError)
    } catch (error: any) {
      console.error(`Erro ao escutar corrida pelo campo ${field}:`, error)
      throw new Error(error.message || 'Erro ao escutar corrida pelo campo')
    }
  }

  listenAllByField(
    field: keyof RideEntity,
    value: any,
    onUpdate: (rides: RideEntity[]) => void,
    onError?: (err: Error) => void,
    options: {
      limit?: number
      orderBy?: keyof RideEntity
      orderDirection?: 'asc' | 'desc'
    } = {}
  ) {
    try {
      return rideRepository.listenAllByField(
        field,
        value,
        onUpdate,
        onError,
        options
      )
    } catch (error: any) {
      console.error(`Erro ao escutar corridas pelo campo ${field}:`, error)
      throw new Error(error.message || 'Erro ao escutar corridas pelo campo')
    }
  }

  listenAll(
    onUpdate: (rides: RideEntity[]) => void,
    onError?: (err: Error) => void,
    options: {
      filters?: Partial<RideEntity>
      limit?: number
      orderBy?: keyof RideEntity
      orderDirection?: 'asc' | 'desc'
    } = {}
  ) {
    try {
      return rideRepository.listenAll(onUpdate, onError, options)
    } catch (error: any) {
      console.error('Erro ao escutar corridas:', error)
      throw new Error(error.message || 'Erro ao escutar corridas')
    }
  }
}
