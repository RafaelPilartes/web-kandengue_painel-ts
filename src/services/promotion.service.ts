// services/promotion.service.ts
import {
  PromotionEntity,
  PromotionUsageEntity
} from '@/core/entities/Promotion'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { IAllowedUser } from '@/interfaces/IPromotion'
import { promotionRepository } from '@/modules/Api'

export class PromotionService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<PromotionEntity>
  ): Promise<ListResponseType<PromotionEntity[]>> {
    try {
      return await promotionRepository.getAll(limit, offset, searchTerm, filters)
    } catch (error: any) {
      console.error('Erro ao buscar promoções:', error)
      throw new Error(error.message || 'Erro ao buscar promoções')
    }
  }

  async getByCode(code: string): Promise<PromotionEntity | null> {
    try {
      return await promotionRepository.getByCode(code)
    } catch (error: any) {
      console.error(`Erro ao buscar promoção ${code}:`, error)
      throw new Error(error.message || 'Erro ao buscar promoção')
    }
  }

  async create(
    promotion: Omit<PromotionEntity, 'id'>
  ): Promise<PromotionEntity> {
    try {
      return await promotionRepository.create(promotion)
    } catch (error: any) {
      console.error('Erro ao criar promoção:', error)
      throw new Error(error.message || 'Erro ao criar promoção')
    }
  }

  async update(
    code: string,
    promotion: Partial<PromotionEntity>
  ): Promise<PromotionEntity> {
    try {
      return await promotionRepository.update(code, promotion)
    } catch (error: any) {
      console.error(`Erro ao atualizar promoção ${code}:`, error)
      throw new Error(error.message || 'Erro ao atualizar promoção')
    }
  }

  async setActive(code: string, active: boolean): Promise<void> {
    try {
      return await promotionRepository.setActive(code, active)
    } catch (error: any) {
      console.error(`Erro ao mudar status de ${code}:`, error)
      throw new Error(error.message || 'Erro ao mudar status')
    }
  }

  async addAllowedUser(
    code: string,
    userId: string,
    addedBy: string
  ): Promise<void> {
    return promotionRepository.addAllowedUser(code, userId, addedBy)
  }

  async addAllowedUsersBulk(
    code: string,
    userIds: string[],
    addedBy: string
  ): Promise<void> {
    return promotionRepository.addAllowedUsersBulk(code, userIds, addedBy)
  }

  async removeAllowedUser(code: string, userId: string): Promise<void> {
    return promotionRepository.removeAllowedUser(code, userId)
  }

  async listAllowedUsers(code: string): Promise<IAllowedUser[]> {
    return promotionRepository.listAllowedUsers(code)
  }

  async listUsages(
    code: string,
    limit = 100
  ): Promise<PromotionUsageEntity[]> {
    return promotionRepository.listUsages(code, limit)
  }

  async listUsedCountsByPromotion(): Promise<Record<string, number>> {
    return promotionRepository.listUsedCountsByPromotion()
  }
}
