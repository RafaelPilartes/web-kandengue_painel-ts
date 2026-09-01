import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

/**
 * Híbrido: lê do Firestore via `walletRepository` (`ReadOnlyDAO`), escreve
 * pela API via `adminMoney` — as operações de dinheiro vivem em transacções
 * auditadas no servidor. Ver nota em `IWalletRepository`.
 */
export class WalletUseCase extends BaseUseCase {
  protected readonly context = 'WalletUseCase'

  private get repository() {
    return ApiRepository.wallets
  }

  private get adminMoneyRepository() {
    return ApiRepository.adminMoney
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity[]>> {
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

  executeGetById(id: string): Promise<WalletEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  // `IWalletRepository.getOneByField` não estende `IBaseRepository`: aceita
  // só `keyof WalletEntity`, sem caminhos aninhados.
  executeGetOneByField(
    field: keyof WalletEntity,
    value: unknown
  ): Promise<WalletEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  // Aqui o filtro é montado à mão (como no `driverUseCase`), não passa por
  // `getAllByField` do repositório — por isso aceita `FieldPath<WalletEntity>`,
  // incluindo caminhos aninhados como `user.email`.
  executeGetAllByField(
    field: FieldPath<WalletEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<WalletEntity>
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

  /**
   * Cria a carteira no servidor, numa transacção auditada. É a única porta
   * de criação — a escrita directa produzia carteiras sem `user_id`, que a
   * app do motorista nunca encontrava.
   *
   * NÃO passa pelo `run()`: o `toAppError` substituiria a mensagem da API
   * por uma genérica, e o admin deixaria de saber o que correu mal. O
   * `ApiDAO` já extrai a mensagem do servidor.
   */
  executeCreateViaApi(input: {
    user_id: string
    user: { id: string; firebase_uid: string; [key: string]: unknown }
    initial_balance: number
    currency: string
    status: string
    reason?: string
  }): Promise<{ walletId: string; balance: number }> {
    return this.adminMoneyRepository.createWallet(input)
  }

  /**
   * Activa ou desactiva a carteira no servidor, com auditoria dentro da
   * transacção. Substitui o apagar: apagar destruía o registo do dinheiro
   * devido ao motorista e deixava órfãs as transacções da carteira.
   *
   * NÃO passa pelo `run()`, pela mesma razão do `executeCreateViaApi`.
   */
  executeSetStatus(
    walletId: string,
    status: 'active' | 'inactive',
    reason?: string
  ): Promise<{ changed: boolean; status: 'active' | 'inactive' }> {
    return this.adminMoneyRepository.setWalletStatus(walletId, status, reason)
  }
}

export const walletUseCase = new WalletUseCase()
