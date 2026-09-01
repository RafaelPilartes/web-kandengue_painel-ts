import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import {
  PromotionEntity,
  PromotionUsageEntity
} from '@/core/entities/Promotion'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/promotion'

// A normalização do código (uppercase + trim) já vive no
// `FirebasePromotionDAO.normalizeCode` — não duplicar aqui.
export class PromotionUseCase extends BaseUseCase {
  protected readonly context = 'PromotionUseCase'

  private get repository() {
    return ApiRepository.promotions
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<PromotionEntity>
  ): Promise<ListResponseType<PromotionEntity[]>> {
    return this.run('getAll', () =>
      this.repository.getAll(limit, offset, searchTerm, filters)
    )
  }

  executeGetByCode(code: string): Promise<PromotionEntity | null> {
    return this.run('getByCode', () => this.repository.getByCode(code))
  }

  executeCreate(
    promotion: Omit<PromotionEntity, 'id'>
  ): Promise<PromotionEntity> {
    return this.run('create', () => this.repository.create(promotion))
  }

  executeUpdate(
    code: string,
    promotion: Partial<PromotionEntity>
  ): Promise<PromotionEntity> {
    return this.run('update', () => this.repository.update(code, promotion))
  }

  executeSetActive(code: string, active: boolean): Promise<void> {
    return this.run('setActive', () =>
      this.repository.setActive(code, active)
    )
  }

  executeAddAllowedUser(
    code: string,
    userId: string,
    addedBy: string
  ): Promise<void> {
    return this.run('addAllowedUser', () =>
      this.repository.addAllowedUser(code, userId, addedBy)
    )
  }

  executeAddAllowedUsersBulk(
    code: string,
    userIds: string[],
    addedBy: string
  ): Promise<void> {
    return this.run('addAllowedUsersBulk', () =>
      this.repository.addAllowedUsersBulk(code, userIds, addedBy)
    )
  }

  executeRemoveAllowedUser(code: string, userId: string): Promise<void> {
    return this.run('removeAllowedUser', () =>
      this.repository.removeAllowedUser(code, userId)
    )
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
