import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from './IBaseRepository'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/types'
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '../entities/Promotion'

/**
 * Não estende `IBaseRepository`: isso traria `create`, `update` e `delete`
 * de volta ao tipo — mesmo que a implementação os recusasse em runtime.
 * As escritas vivem na API. Ver `IWalletRepository`.
 */
export interface IWithdrawalRepository {
  getAll(
    options?: QueryOptions<WithdrawalRequestEntity>
  ): Promise<ListResponseType<WithdrawalRequestEntity[]>>

  getById(id: string): Promise<WithdrawalRequestEntity | null>

  countByStatus(status: WithdrawalStatus): Promise<number>

  /**
   * Resolve os earnings ligados a um saque (para o detalhe).
   */
  getEarningsByIds(ids: string[]): Promise<ReferralEarningEntity[]>
}
