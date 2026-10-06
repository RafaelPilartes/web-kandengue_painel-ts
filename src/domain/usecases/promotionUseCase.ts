import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import {
  PromotionEntity,
  PromotionUsageEntity
} from '@/core/entities/Promotion'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/interfaces'
import type {
  AllowedUsersResult,
  CreatePromotionPayload,
  PromotionPayload,
  PromotionWriteResult
} from '@/core/interfaces/IAdminPromotionRepository'

// A normalização do código (uppercase + trim) é da API, que o usa como id do
// documento — não se duplica aqui.

/** Default do DAO anterior (o motor usa 50). Preservado para não mudar o
 *  número de promoções que a página recebe. */
const LEGACY_PAGE_SIZE = 100
export class PromotionUseCase extends BaseUseCase {
  protected readonly context = 'PromotionUseCase'

  /** Leitura — Firestore directo, as regras mantêm-na aberta ao admin. */
  private get repository() {
    return ApiRepository.promotions
  }

  /** Escrita — a API, com validação e auditoria campo a campo. */
  private get writeRepository() {
    return ApiRepository.adminPromotions
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<PromotionEntity>
  ): Promise<ListResponseType<PromotionEntity[]>> {
    return this.run('getAll', async () => {
      const base = { searchTerm, filters }
      const after = await this.offsetToCursor(
        this.repository,
        base,
        offset ?? 0
      )
      return this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    })
  }

  executeGetByCode(code: string): Promise<PromotionEntity | null> {
    return this.run('getByCode', () => this.repository.getByCode(code))
  }

  /*
   * As cinco escritas **não** passam pelo `run()`, como as outras acções de
   * admin que vão pela API (`executePayMissionProgress`,
   * `executeMarkFareReviewed`): o `toAppError` substituiria a mensagem da API
   * por uma genérica, e o admin deixava de saber o que falhou — "o código já
   * existe", "a data de fim é anterior à de início", "o desconto máximo só se
   * aplica a percentagens".
   */

  executeCreate(
    payload: CreatePromotionPayload
  ): Promise<PromotionWriteResult> {
    return this.writeRepository.create(payload)
  }

  executeUpdate(
    code: string,
    payload: PromotionPayload
  ): Promise<PromotionWriteResult> {
    return this.writeRepository.update(code, payload)
  }

  executeSetActive(
    code: string,
    active: boolean
  ): Promise<PromotionWriteResult> {
    return this.writeRepository.setActive(code, active)
  }

  executeAddAllowedUsersBulk(
    code: string,
    userIds: string[]
  ): Promise<AllowedUsersResult> {
    return this.writeRepository.addAllowedUsers(code, userIds)
  }

  executeRemoveAllowedUser(
    code: string,
    userId: string
  ): Promise<{ code: string; removed: boolean }> {
    return this.writeRepository.removeAllowedUser(code, userId)
  }

  executeListAllowedUsers(code: string): Promise<AllowedUser[]> {
    return this.run('listAllowedUsers', () =>
      this.repository.listAllowedUsers(code)
    )
  }

  executeListUsages(
    code: string,
    limit = 100
  ): Promise<PromotionUsageEntity[]> {
    return this.run('listUsages', () =>
      this.repository.listUsages(code, limit)
    )
  }
}

export const promotionUseCase = new PromotionUseCase()
