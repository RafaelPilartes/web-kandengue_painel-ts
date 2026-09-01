// services/drivers.service.ts
import { driverRepository } from '@/modules/Api'
import { DriverEntity } from '@/core/entities/Driver'
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
  base: Omit<QueryOptions<DriverEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await driverRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class DriverService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DriverEntity>
  ): Promise<ListResponseType<DriverEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await driverRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar motoristas:', error)
      throw new Error(error.message || 'Erro ao buscar motoristas')
    }
  }

  async getById(id: string): Promise<DriverEntity | null> {
    try {
      return await driverRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar motorista ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar motorista')
    }
  }

  // get one by custom field
  async getOneByField(field: string, value: any): Promise<DriverEntity | null> {
    try {
      return await driverRepository.getOneByField(
        field as keyof DriverEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar driver por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar driver')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DriverEntity[]>> {
    try {
      const filters = { [field]: value } as Partial<DriverEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await driverRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar motorista pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar motorista')
    }
  }

  async getByEmail(email: string): Promise<DriverEntity | null> {
    try {
      return await driverRepository.getByEmail(email)
    } catch (error: any) {
      console.error(`Erro ao buscar motorista ${email}:`, error)
      throw new Error(error.message || 'Erro ao buscar motorista')
    }
  }

  async create(driver: Omit<DriverEntity, 'id'>): Promise<DriverEntity> {
    if (!driver.name || !driver.email) {
      throw new Error('Nome e email são obrigatórios')
    }

    try {
      return await driverRepository.create(driver)
    } catch (error: any) {
      console.error('Erro ao criar motorista:', error)
      throw new Error(error.message || 'Erro ao criar motorista')
    }
  }

  async update(
    id: string,
    driver: Partial<DriverEntity>
  ): Promise<DriverEntity> {
    try {
      return await driverRepository.update(id, driver)
    } catch (error: any) {
      console.error(`Erro ao atualizar motorista ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar motorista')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await driverRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar motorista ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar motorista')
    }
  }

  async softDelete(id: string, firebaseUid?: string): Promise<void> {
    try {
      return await driverRepository.softDelete(id, firebaseUid)
    } catch (error: any) {
      console.error(`Erro ao soft-deletar motorista ${id}:`, error)
      throw new Error(error.message || 'Erro ao soft-deletar motorista')
    }
  }

  listenOnlineDrivers(
    onUpdate: (drivers: DriverEntity[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    return driverRepository.listenOnlineDrivers(onUpdate, onError)
  }
}
