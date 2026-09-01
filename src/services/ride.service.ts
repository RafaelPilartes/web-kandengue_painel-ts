import { rideRepository } from '@/modules/Api'
import { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import { MissionService } from './mission.service'

const missionService = new MissionService()

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

/**
 * Traduz `offset` (paginação por número de registos saltados, como o DAO
 * antigo fazia) para o cursor por `id` que o `BaseFirebaseDAO` espera.
 * Mesmo custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<RideEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await rideRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class RideService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await rideRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
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
      return await rideRepository.getOneByField(
        field as keyof RideEntity,
        value
      )
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
      const filters = { [field]: value } as Partial<RideEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await rideRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

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
      return rideRepository.listenById(id, data => {
        if (data) onUpdate(data)
      }, onError)
    } catch (error: any) {
      console.error(`Erro ao escutar corrida ${id} em tempo real:`, error)
      throw new Error(error.message || 'Erro ao escutar corrida em tempo real')
    }
  }

  /**
   * Antes era um método próprio do DAO, escutando só a alteração `added`.
   * Traduzido para `listenAllByField`, que o `BaseFirebaseDAO` já tem —
   * `limit: 1` preserva "só o primeiro resultado".
   */
  listenByField(
    field: keyof RideEntity,
    value: string,
    onUpdate: (ride: RideEntity) => void,
    onError?: (err: Error) => void
  ) {
    try {
      return rideRepository.listenAllByField(
        field,
        value,
        rides => {
          if (rides.length) onUpdate(rides[0])
        },
        onError,
        { limit: 1 }
      )
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
