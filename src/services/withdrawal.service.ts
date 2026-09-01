// services/withdrawal.service.ts
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '@/core/entities/Promotion'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
import { withdrawalRepository, adminMoneyRepository } from '@/modules/Api'

// Default do DAO antigo — preservado aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 50

/**
 * Traduz `offset` (paginação por número de registos saltados, como o DAO
 * antigo fazia) para o cursor por `id` que o `ReadOnlyDAO` espera. Mesmo
 * custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<WithdrawalRequestEntity>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await withdrawalRepository.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

export class WithdrawalService {
  async getAll(
    limit?: number,
    offset?: number,
    filters?: { status?: WithdrawalStatus; user_id?: string }
  ): Promise<ListResponseType<WithdrawalRequestEntity[]>> {
    try {
      const base = { filters }
      const after = await offsetToCursor(base, offset ?? 0)
      return await withdrawalRepository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    } catch (error: any) {
      console.error('Erro ao buscar saques:', error)
      throw new Error(error.message || 'Erro ao buscar saques')
    }
  }

  async getById(id: string): Promise<WithdrawalRequestEntity | null> {
    try {
      return await withdrawalRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar saque ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar saque')
    }
  }

  async countByStatus(status: WithdrawalStatus): Promise<number> {
    try {
      return await withdrawalRepository.countByStatus(status)
    } catch (error) {
      console.warn('Falha ao contar saques:', error)
      return 0
    }
  }

  async getEarningsByIds(ids: string[]): Promise<ReferralEarningEntity[]> {
    return withdrawalRepository.getEarningsByIds(ids)
  }

  /** Aprova no servidor. `changed: false` significa que já estava aprovado. */
  async approve(id: string): Promise<{ changed: boolean }> {
    return adminMoneyRepository.approveWithdrawal(id)
  }

  async reject(
    id: string,
    reason: string
  ): Promise<{ changed: boolean; revertedEarnings: number }> {
    return adminMoneyRepository.rejectWithdrawal(id, reason)
  }

  async markAsPaid(
    id: string
  ): Promise<{ changed: boolean; paidEarnings: number }> {
    return adminMoneyRepository.markWithdrawalPaid(id)
  }
}
