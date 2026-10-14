import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { AppError } from '@/domain/errors/AppError'
import type { DriverEntity } from '@/core/entities/Driver'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import type { ServiceResult } from '@/core/interfaces/IAdminDriverRepository'
import type { RideType } from '@/types/enum'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class DriverUseCase extends BaseUseCase {
  protected readonly context = 'DriverUseCase'

  private get repository() {
    return ApiRepository.drivers
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<DriverEntity>
  ): Promise<ListResponseType<DriverEntity[]>> {
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

  executeGetById(id: string): Promise<DriverEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetByEmail(email: string): Promise<DriverEntity | null> {
    return this.run('getByEmail', () => this.repository.getByEmail(email))
  }

  executeGetOneByField(
    field: FieldPath<DriverEntity>,
    value: unknown
  ): Promise<DriverEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<DriverEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<DriverEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<DriverEntity>
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

  executeCreate(driver: Omit<DriverEntity, 'id'>): Promise<DriverEntity> {
    return this.run('create', () => {
      if (!driver.name || !driver.email) {
        throw new AppError(
          'failed-precondition',
          'Nome e email são obrigatórios.'
        )
      }
      return this.repository.create(driver)
    })
  }

  executeUpdate(id: string, driver: Partial<DriverEntity>): Promise<DriverEntity> {
    return this.run('update', () => this.repository.update(id, driver))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }

  /**
   * Marca `status: 'deleted'` sem apagar o documento e, se `firebaseUid` for
   * o do utilizador com sessão iniciada, apaga também a conta no Firebase
   * Auth. Assinatura preservada — o ViewModel depende dela.
   */
  executeSoftDelete(id: string, firebaseUid?: string): Promise<void> {
    return this.run('softDelete', () =>
      this.repository.softDelete(id, firebaseUid)
    )
  }

  /**
   * The services a driver is approved for — **through the API** (3.7).
   *
   * ⚠️ **It is not an `update` to the document, and that is the change.** The
   * panel used to write `drivers.services` via the client SDK, with the
   * requirement check on the screen: anyone who opened the browser console
   * could approve themselves for `moto_taxi` with no insurance, no helmet and
   * no licence. The server is what checks now, against the lib's
   * `SERVICE_REQUIREMENTS`, and every decision leaves a line in `auditLogs` —
   * including what the admin confirmed by hand.
   *
   * Outside `run()`, like the other admin actions: the API's message is the
   * one that says **what is missing**, and the generic `run()` buried it.
   */
  executeAddService(
    driverId: string,
    service: RideType,
    confirmations: string[] = []
  ): Promise<ServiceResult> {
    return ApiRepository.adminDriver.addService(driverId, service, confirmations)
  }

  /** Removing is never blocked — only recorded. */
  executeRemoveService(
    driverId: string,
    service: RideType
  ): Promise<ServiceResult> {
    return ApiRepository.adminDriver.removeService(driverId, service)
  }

  /**
   * Devolve a função de cancelamento — não passa pelo `run()`, que é para
   * operações que devolvem valor. Perder esta função deixa o listener
   * pendurado e o painel a acumular subscrições.
   */
  executeListenOnlineDrivers(
    onUpdate: (drivers: DriverEntity[]) => void,
    onError?: (err: Error) => void
  ): () => void {
    return this.repository.listenOnlineDrivers(onUpdate, onError)
  }
}

export const driverUseCase = new DriverUseCase()
