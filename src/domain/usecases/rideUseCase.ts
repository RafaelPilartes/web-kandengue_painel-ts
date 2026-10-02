import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { missionUseCase } from './missionUseCase'
import type { RideEntity } from '@/core/entities/Ride'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath, ListenOptions } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class RideUseCase extends BaseUseCase {
  protected readonly context = 'RideUseCase'

  private get repository() {
    return ApiRepository.rides
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity[]>> {
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

  executeGetById(id: string): Promise<RideEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: FieldPath<RideEntity>,
    value: unknown
  ): Promise<RideEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<RideEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<RideEntity>
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

  executeCreate(ride: Omit<RideEntity, 'id'>): Promise<RideEntity> {
    return this.run('create', () => this.repository.create(ride))
  }

  executeUpdate(id: string, ride: Partial<RideEntity>): Promise<RideEntity> {
    return this.run('update', async () => {
      const updated = await this.repository.update(id, ride)

      // Recalcula o progresso das missões quando a corrida conclui.
      // O trigger `onRideUpdated` do servidor faz o mesmo — é redundante,
      // mas o cálculo recomeça do zero (não incrementa), portanto correr
      // duas vezes dá o mesmo resultado. O erro é engolido de propósito:
      // a corrida actualiza-se na mesma se o progresso falhar.
      if (ride.status === 'completed' && updated.driver?.id) {
        missionUseCase
          .executeUpdateDriverProgress(updated.driver.id)
          .catch(err => {
            console.error('Erro ao atualizar progresso de missões:', err)
          })
      }

      return updated
    })
  }

  /**
   * Marca a tarifa como revista, pela API. **Não altera a tarifa.**
   *
   * Fora do `run()`, como as outras acções de admin: a mensagem da API é a
   * que diz ao admin porque é que não passou (por exemplo, uma corrida que
   * não está sinalizada para revisão).
   */
  executeMarkFareReviewed(
    id: string,
    note?: string
  ): Promise<{ changed: boolean }> {
    return ApiRepository.adminRide.markFareReviewed(id, note)
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }

  /** Listener directo — não passa pelo `run()`, que é só para operações que devolvem valor. */
  executeListenRideRealtime(
    id: string,
    onUpdate: (ride: RideEntity) => void,
    onError?: (err: Error) => void
  ): () => void {
    return this.repository.listenById(id, data => {
      if (data) onUpdate(data)
    }, onError)
  }

  /**
   * Antes era um método próprio do DAO, escutando só a alteração `added`.
   * Traduzido para `listenAllByField`, que o `BaseFirebaseDAO` já tem —
   * `limit: 1` preserva "só o primeiro resultado".
   */
  executeListenByField(
    field: FieldPath<RideEntity>,
    value: string,
    onUpdate: (ride: RideEntity) => void,
    onError?: (err: Error) => void
  ): () => void {
    return this.repository.listenAllByField(
      field,
      value,
      rides => {
        if (rides.length) onUpdate(rides[0])
      },
      onError,
      { limit: 1 }
    )
  }

  executeListenAllByField(
    field: FieldPath<RideEntity>,
    value: unknown,
    onUpdate: (rides: RideEntity[]) => void,
    onError?: (err: Error) => void,
    options: Omit<ListenOptions<RideEntity>, 'filters'> = {}
  ): () => void {
    return this.repository.listenAllByField(
      field,
      value,
      onUpdate,
      onError,
      options
    )
  }

  executeListenAll(
    onUpdate: (rides: RideEntity[]) => void,
    onError?: (err: Error) => void,
    options: ListenOptions<RideEntity> = {}
  ): () => void {
    return this.repository.listenAll(onUpdate, onError, options)
  }
}

export const rideUseCase = new RideUseCase()
