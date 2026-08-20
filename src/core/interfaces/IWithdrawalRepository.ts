import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
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
}
