// core/interfaces/IPromotionRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/promotion'
import type {
  PromotionEntity,
  PromotionUsageEntity
} from '../entities/Promotion'

/**
 * O id do documento é o código normalizado (uppercase + trim), não um id
 * gerado. Por isso `create` e `update` são redeclarados aqui com a forma
 * própria desta colecção, e o DAO sobrepõe-nos ao motor:
 *
 * - `create` tem de inicializar os shards (`counters/shard_0..N-1`) no mesmo
 *   batch do documento principal — sem isso a CAMADA 1 do `apply` falha.
 * - `update` tem de apagar campos de facto (`deleteField`) quando o admin os
 *   limpa, coisa que o update genérico do motor não faz, e tem de recusar
 *   alterações ao código, aos contadores e à auditoria de criação.
 */
export interface IPromotionRepository
  extends Omit<IBaseRepository<PromotionEntity>, 'create' | 'update'> {
  create(promotion: Omit<PromotionEntity, 'id'>): Promise<PromotionEntity>
  update(
    code: string,
    promotion: Partial<PromotionEntity>
  ): Promise<PromotionEntity>

  getByCode(code: string): Promise<PromotionEntity | null>
  setActive(code: string, active: boolean): Promise<void>

  // Allowed users (subcolecção — evita o limite de 1MB de um array)
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

  // Usages — leitura para o detalhe da promoção
  listUsages(code: string, limit?: number): Promise<PromotionUsageEntity[]>
}
