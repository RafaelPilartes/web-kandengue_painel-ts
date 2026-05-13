import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '../entities/Promotion'

export interface IWithdrawalRepository {
  getAll(
    limit?: number,
    offset?: number,
    filters?: { status?: WithdrawalStatus; user_id?: string }
  ): Promise<ListResponseType<WithdrawalRequestEntity[]>>

  getById(id: string): Promise<WithdrawalRequestEntity | null>

  countByStatus(status: WithdrawalStatus): Promise<number>

  /**
   * Resolve os earnings ligados a um saque (para o detalhe).
   */
  getEarningsByIds(ids: string[]): Promise<ReferralEarningEntity[]>

  /** Aprovar — apenas muda status para 'approved'. */
  approve(id: string, adminId: string): Promise<void>

  /**
   * Rejeitar — transação atómica que:
   *  1. atualiza withdrawal.status → 'rejected' com admin_notes
   *  2. reverte cada earning ligado: status 'requested' → 'pending'
   */
  reject(id: string, adminId: string, reason: string): Promise<void>

  /** Marcar como pago — preenche `paid_at` + earnings → 'paid'. */
  markAsPaid(id: string, adminId: string): Promise<void>
}
