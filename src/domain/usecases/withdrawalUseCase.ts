import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '@/core/entities/Promotion'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'

// Default do DAO antigo — preservado aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 50

/**
 * Híbrido: lê do Firestore via `withdrawalRepository` (`ReadOnlyDAO`),
 * escreve pela API via `adminMoney` — aprovar, rejeitar e marcar-pago
 * correm em transacções auditadas no servidor. Ver nota em
 * `IWithdrawalRepository`.
 */
export class WithdrawalUseCase extends BaseUseCase {
  protected readonly context = 'WithdrawalUseCase'

  private get repository() {
    return ApiRepository.withdrawals
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    filters?: { status?: WithdrawalStatus; user_id?: string }
  ): Promise<ListResponseType<WithdrawalRequestEntity[]>> {
    return this.run('getAll', async () => {
      const base = { filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)
      return this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    })
  }

  executeGetById(id: string): Promise<WithdrawalRequestEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  /** Delega no `count` do motor. */
  executeCountByStatus(status: WithdrawalStatus): Promise<number> {
    return this.run('countByStatus', () => this.repository.countByStatus(status))
  }

  /**
   * Resolve os earnings ligados a um saque, para o ecrã de detalhe. O
   * agrupamento em lotes de 30 (limite do operador `in` do Firestore) vive
   * no `FirebaseWithdrawalDAO` — este método só delega.
   */
  executeGetEarningsByIds(ids: string[]): Promise<ReferralEarningEntity[]> {
    return this.run('getEarningsByIds', () =>
      this.repository.getEarningsByIds(ids)
    )
  }

  /**
   * Aprova no servidor. `changed: false` significa que já estava aprovado —
   * não é erro.
   *
   * NÃO passa pelo `run()`: o `toAppError` substituiria a mensagem da API
   * por uma genérica, e o admin deixaria de saber o que correu mal. O
   * `ApiDAO` já extrai a mensagem do servidor.
   */
  executeApprove(id: string): Promise<{ changed: boolean }> {
    return ApiRepository.adminMoney.approveWithdrawal(id)
  }

  /**
   * Rejeita no servidor e reverte os earnings. NÃO passa pelo `run()`, pela
   * mesma razão do `executeApprove`.
   */
  executeReject(
    id: string,
    reason: string
  ): Promise<{ changed: boolean; revertedEarnings: number }> {
    return ApiRepository.adminMoney.rejectWithdrawal(id, reason)
  }

  /**
   * Marca como pago no servidor. NÃO passa pelo `run()`, pela mesma razão
   * do `executeApprove`.
   */
  executeMarkAsPaid(
    id: string
  ): Promise<{ changed: boolean; paidEarnings: number }> {
    return ApiRepository.adminMoney.markWithdrawalPaid(id)
  }
}

export const withdrawalUseCase = new WithdrawalUseCase()
