import { ApiRepository } from '@/modules/Api/factory'
import type { PrivateContacts } from '@/helpers/rideContacts'
import { BaseUseCase } from './BaseUseCase'
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

  /**
   * ⚠️ **Já não recalcula o progresso das missões.**
   *
   * Chamava o recálculo quando a corrida passava a `completed`, por cima do
   * que o trigger `onRideUpdated` já fazia no servidor. Era redundante — e
   * agora seria uma escrita que as regras negam: os campos de pagamento do
   * `missionProgress` são só do servidor.
   *
   * Quem conta as corridas para as missões é o trigger. Para forçar, há o
   * botão "Recalcular progresso", que chama a API.
   */
  executeUpdate(id: string, ride: Partial<RideEntity>): Promise<RideEntity> {
    return this.run('update', () => this.repository.update(id, ride))
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

  /**
   * A ride's private contacts (3.2), for the detail panel to show.
   *
   * ⚠️ **It never fails because the document is missing:** rides older than
   * 3.2 do not have it, and the screen falls back to the embedded copy. A
   * `null` here is information, not an error — which is why it does not go
   * through `run()`, that turns failures into `AppError`.
   */
  async executeGetPrivateContacts(id: string): Promise<PrivateContacts | null> {
    try {
      return await this.repository.getPrivateContacts(id)
    } catch (error) {
      // A denying rule, or the network: the screen shows the fallback and moves on.
      console.error('[rideUseCase] private contacts', error)
      return null
    }
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
