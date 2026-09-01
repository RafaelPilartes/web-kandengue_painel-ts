// services/rideRates.service.ts
import { rideRateRepository } from '@/modules/Api'
import { RideRateEntity } from '@/core/entities/RideRate'
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
  base: Omit<QueryOptions<RideRateEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await rideRateRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class RideRateService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await rideRateRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
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
      return await rideRateRepository.getOneByField(
        field as keyof RideRateEntity,
        value
      )
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
      const filters = { [field]: value } as Partial<RideRateEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await rideRateRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

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
