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
   * Os serviços que o motorista está aprovado a fazer — **pela API** (3.7).
   *
   * ⚠️ **Não é um `update` ao documento, e é essa a mudança.** O painel
   * escrevia `drivers.services` pelo SDK cliente, com a verificação dos
   * requisitos no ecrã: quem abrisse a consola do browser aprovava-se a si
   * mesmo para `moto_taxi` sem seguro, sem capacete e sem carta. Agora quem
   * verifica é o servidor, contra a `SERVICE_REQUIREMENTS` da lib, e cada
   * decisão deixa uma linha em `auditLogs` — incluindo o que o admin
   * confirmou à mão.
   *
   * Fora do `run()`, como as outras acções de admin: a mensagem da API é a
   * que diz **o que falta**, e o `run()` genérico tapava-a.
   */
  executeAddService(
    driverId: string,
    service: RideType,
    confirmations: string[] = []
  ): Promise<ServiceResult> {
    return ApiRepository.adminDriver.addService(driverId, service, confirmations)
  }

  /** Retirar nunca é bloqueado — só registado. */
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
