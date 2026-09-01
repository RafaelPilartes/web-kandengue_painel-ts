import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { RideRateEntity } from '@/core/entities/RideRate'
import type { ListResponseType } from '@/interfaces/IApiResponse'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class RideRateUseCase extends BaseUseCase {
  protected readonly context = 'RideRateUseCase'

  private get repository() {
    return ApiRepository.rideRates
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideRateEntity>
  ): Promise<ListResponseType<RideRateEntity[]>> {
    return this.run('getAll', async () => {
      const base = { searchTerm, filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)
      return this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    })
  }

  executeGetById(id: string): Promise<RideRateEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: string,
    value: unknown
  ): Promise<RideRateEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field as keyof RideRateEntity, value)
    )
  }

  executeGetAllByField(
    field: string,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideRateEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<RideRateEntity>
      const base = { filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)

      const { data, pagination } = await this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    })
  }

  executeCreate(rideRate: Omit<RideRateEntity, 'id'>): Promise<RideRateEntity> {
    return this.run('create', () => this.repository.create(rideRate))
  }

  executeUpdate(
    id: string,
    rideRate: Partial<RideRateEntity>
  ): Promise<RideRateEntity> {
    return this.run('update', () => this.repository.update(id, rideRate))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }
}

export const rideRateUseCase = new RideRateUseCase()
