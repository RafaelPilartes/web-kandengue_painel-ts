import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/promotion'
import {
  PromotionEntity,
  PromotionUsageEntity
} from '../entities/Promotion'

export interface IPromotionRepository {
  // CRUD básico (doc id = code uppercase)
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<PromotionEntity>
  ): Promise<ListResponseType<PromotionEntity[]>>
  getByCode(code: string): Promise<PromotionEntity | null>

  /**
   * Cria uma promoção. O DAO deve normalizar o código (uppercase + trim)
   * e inicializar todos os shards (`counters/shard_0..N-1`) com zeros
   * num batch atómico — sem isso a CAMADA 1 do `apply` falha.
   */
  create(
    promotion: Omit<PromotionEntity, 'id'>
  ): Promise<PromotionEntity>

  update(
    code: string,
    promotion: Partial<PromotionEntity>
  ): Promise<PromotionEntity>

  setActive(code: string, active: boolean): Promise<void>

  // Allowed users (subcollection — evita limite de array de 1MB)
  addAllowedUser(
    code: string,
    userId: string,
    addedBy: string
  ): Promise<void>
  addAllowedUsersBulk(
    code: string,
    userIds: string[],
    addedBy: string
  ): Promise<void>
  removeAllowedUser(code: string, userId: string): Promise<void>
  listAllowedUsers(code: string): Promise<AllowedUser[]>

  // Usages — leitura para detalhe da promoção
  listUsages(
    code: string,
    limit?: number
  ): Promise<PromotionUsageEntity[]>
}
