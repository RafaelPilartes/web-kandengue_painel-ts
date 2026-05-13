// services/withdrawal.service.ts
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '@/core/entities/Promotion'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
import { withdrawalRepository } from '@/modules/Api'

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

  async approve(id: string, adminId: string): Promise<void> {
    try {
      return await withdrawalRepository.approve(id, adminId)
    } catch (error: any) {
      console.error('Erro ao aprovar saque:', error)
      throw new Error(error.message || 'Erro ao aprovar saque')
    }
  }

  async reject(id: string, adminId: string, reason: string): Promise<void> {
    if (!reason.trim()) {
      throw new Error('Motivo da rejeição é obrigatório')
    }
    try {
      return await withdrawalRepository.reject(id, adminId, reason.trim())
    } catch (error: any) {
      console.error('Erro ao rejeitar saque:', error)
      throw new Error(error.message || 'Erro ao rejeitar saque')
    }
  }

  async markAsPaid(id: string, adminId: string): Promise<void> {
    try {
      return await withdrawalRepository.markAsPaid(id, adminId)
    } catch (error: any) {
      console.error('Erro ao marcar saque como pago:', error)
      throw new Error(error.message || 'Erro ao marcar saque como pago')
    }
  }
}
