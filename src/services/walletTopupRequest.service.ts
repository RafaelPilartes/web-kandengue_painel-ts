// services/walletTopupRequests.service.ts
import { walletTopupRequestRepository, adminMoneyRepository } from '@/modules/Api'
import { WalletTopupRequestEntity } from '@/core/entities/WalletTopupRequest'
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
  base: Omit<QueryOptions<WalletTopupRequestEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await walletTopupRequestRepository.getAll({
    ...base,
    limit: offset
  })
  return skipped.data[skipped.data.length - 1]?.id
}

export class WalletTopupRequestService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletTopupRequestEntity>
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
    try {
      const base = { searchTerm, filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await walletTopupRequestRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar carteiras:', error)
      throw new Error(error.message || 'Erro ao buscar carteiras')
    }
  }

  async getById(id: string): Promise<WalletTopupRequestEntity | null> {
    try {
      return await walletTopupRequestRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar carteira')
    }
  }

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<WalletTopupRequestEntity | null> {
    try {
      return await walletTopupRequestRepository.getOneByField(
        field as keyof WalletTopupRequestEntity,
        value
      )
    } catch (error: any) {
      console.error(
        `Erro ao buscar walletTopupRequest por ${field}-${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar walletTopupRequest')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
    try {
      const filters = { [field]: value } as Partial<WalletTopupRequestEntity>
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)

      const { data, pagination } = await walletTopupRequestRepository.getAll({
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

  async create(
    walletTopupRequest: Omit<WalletTopupRequestEntity, 'id'>
  ): Promise<WalletTopupRequestEntity> {
    try {
      return await walletTopupRequestRepository.create(walletTopupRequest)
    } catch (error: any) {
      console.error('Erro ao criar carteira:', error)
      throw new Error(error.message || 'Erro ao criar carteira')
    }
  }

  async update(
    id: string,
    walletTopupRequest: Partial<WalletTopupRequestEntity>
  ): Promise<WalletTopupRequestEntity> {
    try {
      return await walletTopupRequestRepository.update(id, walletTopupRequest)
    } catch (error: any) {
      console.error(`Erro ao atualizar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar carteira')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await walletTopupRequestRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar carteira')
    }
  }

  /**
   * Aprova e credita no servidor, numa transacção idempotente.
   * `credited: false` significa que já estava aprovado — não é erro.
   */
  async approveTopup(
    id: string
  ): Promise<{ credited: boolean; balance: number }> {
    return adminMoneyRepository.approveTopup(id)
  }
}
