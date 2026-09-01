import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { RideTrackingEntity } from '@/core/entities/RideTracking'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class RideTrackingUseCase extends BaseUseCase {
  protected readonly context = 'RideTrackingUseCase'

  private get repository() {
    return ApiRepository.rideTrackings
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideTrackingEntity>
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
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

  executeGetById(id: string): Promise<RideTrackingEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: FieldPath<RideTrackingEntity>,
    value: unknown
  ): Promise<RideTrackingEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<RideTrackingEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideTrackingEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<RideTrackingEntity>
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

  executeCreate(
    rideTracking: Omit<RideTrackingEntity, 'id'>
  ): Promise<RideTrackingEntity> {
    return this.run('create', () => this.repository.create(rideTracking))
  }

  executeUpdate(
    id: string,
    rideTracking: Partial<RideTrackingEntity>
  ): Promise<RideTrackingEntity> {
    return this.run('update', () => this.repository.update(id, rideTracking))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }

  /**
   * Antes era um método próprio do DAO (`listenByRideId`), escutando só a
   * primeira alteração `added`. Traduzido para `listenAllByField`, que o
   * motor já tem — `limit: 1` preserva "só o primeiro resultado".
   */
  listenByRideId(
    rideId: string,
    onUpdate: (tracking: RideTrackingEntity) => void,
    onError?: (err: Error) => void
  ): () => void {
    return this.repository.listenAllByField(
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

export const rideTrackingUseCase = new RideTrackingUseCase()
