// services/rideTrackings.service.ts
import { rideTrackingRepository } from '@/modules/Api'
import { RideTrackingEntity } from '@/core/entities/RideTracking'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

/**
 * Traduz `offset` (paginação por número de registos saltados, como o DAO
 * antigo fazia) para o cursor por `id` que o `BaseFirebaseDAO` espera.
 * Mesmo custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<RideTrackingEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await rideTrackingRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class RideTrackingService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideTrackingEntity>
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await rideTrackingRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
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
      return await rideTrackingRepository.getOneByField(
        field as keyof RideTrackingEntity,
        value
      )
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
      const filters = { [field]: value } as Partial<RideTrackingEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await rideTrackingRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

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

  /**
   * Antes era um método próprio do DAO (`listenByRideId`), escutando só a
   * primeira alteração `added`. Traduzido para `listenAllByField`, que o
   * `BaseFirebaseDAO` já tem — `limit: 1` preserva "só o primeiro resultado".
   */
  listenByRideId(
    rideId: string,
    onUpdate: (tracking: RideTrackingEntity) => void,
    onError?: (err: Error) => void
  ): () => void {
    return rideTrackingRepository.listenAllByField(
      'ride_id',
      rideId,
      trackings => {
        if (trackings.length) onUpdate(trackings[0])
      },
      onError,
      { limit: 1 }
    )
  }
}
