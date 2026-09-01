import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { WalletTopupRequestEntity } from '@/core/entities/WalletTopupRequest'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class WalletTopupRequestUseCase extends BaseUseCase {
  protected readonly context = 'WalletTopupRequestUseCase'

  private get repository() {
    return ApiRepository.walletTopupRequests
  }

  private get adminMoneyRepository() {
    return ApiRepository.adminMoney
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletTopupRequestEntity>
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
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

  executeGetById(id: string): Promise<WalletTopupRequestEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetOneByField(
    field: FieldPath<WalletTopupRequestEntity>,
    value: unknown
  ): Promise<WalletTopupRequestEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<WalletTopupRequestEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<WalletTopupRequestEntity>
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
    walletTopupRequest: Omit<WalletTopupRequestEntity, 'id'>
  ): Promise<WalletTopupRequestEntity> {
    return this.run('create', () => this.repository.create(walletTopupRequest))
  }

  executeUpdate(
    id: string,
    walletTopupRequest: Partial<WalletTopupRequestEntity>
  ): Promise<WalletTopupRequestEntity> {
    return this.run('update', () =>
      this.repository.update(id, walletTopupRequest)
    )
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }

  /**
   * Aprova e credita no servidor, numa transacção idempotente. Chama a API
   * via `ApiRepository.adminMoney`, não o Firestore — o painel deixou de
   * escrever dinheiro. `credited: false` significa que já estava aprovado,
   * não é erro; o `run()` não precisa de outro `try/catch` porque o
   * `ApiDAO` já extrai a mensagem de erro da API.
   */
  executeApproveTopup(
    id: string
  ): Promise<{ credited: boolean; balance: number }> {
    // NÃO passa pelo `run()`: o `toAppError` substituiria a mensagem da API
    // por uma genérica ("Ocorreu um erro inesperado"), e o admin deixaria de
    // saber porque é que a aprovação falhou. O `ApiDAO` já extrai a mensagem
    // do servidor, e a página mostra-a.
    return this.adminMoneyRepository.approveTopup(id)
  }
}

export const walletTopupRequestUseCase = new WalletTopupRequestUseCase()
