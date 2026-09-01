// services/wallets.service.ts
import { walletRepository, adminMoneyRepository } from '@/modules/Api'
import { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'

// Default do DAO antigo — preservado aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

/**
 * Traduz `offset` (paginação por número de registos saltados, como o DAO
 * antigo fazia) para o cursor por `id` que o `ReadOnlyDAO` espera.
 * Mesmo custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<WalletEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await walletRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class WalletService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await walletRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar carteiras:', error)
      throw new Error(error.message || 'Erro ao buscar carteiras')
    }
  }

  async getById(id: string): Promise<WalletEntity | null> {
    try {
      return await walletRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar carteira')
    }
  }

  // get one by custom field
  async getOneByField(field: string, value: any): Promise<WalletEntity | null> {
    try {
      return await walletRepository.getOneByField(
        field as keyof WalletEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar wallet por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar wallet')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletEntity[]>> {
    try {
      const filters = { [field]: value } as Partial<WalletEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await walletRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar carteira pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar carteira')
    }
  }

  /**
   * Cria a carteira no servidor, numa transacção auditada.
   * É a única porta de criação — a escrita directa produzia carteiras sem
   * `user_id`, que a app do motorista nunca encontrava.
   */
  async createViaApi(input: {
    user_id: string
    user: { id: string; firebase_uid: string; [key: string]: unknown }
    initial_balance: number
    currency: string
    status: string
    reason?: string
  }): Promise<{ walletId: string; balance: number }> {
    return adminMoneyRepository.createWallet(input)
  }

  /**
   * Activa ou desactiva a carteira no servidor, com auditoria dentro da
   * transacção. Substitui o apagar: apagar destruía o registo do dinheiro
   * devido ao motorista e deixava órfãs as transacções da carteira.
   */
  async setStatus(
    walletId: string,
    status: 'active' | 'inactive',
    reason?: string
  ): Promise<{ changed: boolean; status: 'active' | 'inactive' }> {
    return adminMoneyRepository.setWalletStatus(walletId, status, reason)
  }
}
