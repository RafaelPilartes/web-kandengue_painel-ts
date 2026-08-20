// services/withdrawal.service.ts
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '@/core/entities/Promotion'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
import { withdrawalRepository, adminMoneyRepository } from '@/modules/Api'

export class WithdrawalService {
  async getAll(
    limit?: number,
    offset?: number,
    filters?: { status?: WithdrawalStatus; user_id?: string }
  ): Promise<ListResponseType<WithdrawalRequestEntity[]>> {
    try {
      return await withdrawalRepository.getAll(limit, offset, filters)
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
