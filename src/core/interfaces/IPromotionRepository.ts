// core/interfaces/IPromotionRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { AllowedUser } from '@rafaelpilartes/kandengue-shared/interfaces'
import type {
  PromotionEntity,
  PromotionUsageEntity
} from '../entities/Promotion'

/**
 * **Só leitura.** As escritas saíram daqui para o `IAdminPromotionRepository`,
 * que fala com `/api/v1/admin/promotions*`.
 *
 * As regras passaram `promotions` e tudo o que está por baixo a
 * `allow write: if false`, admin incluído: o que este repositório tentasse
 * escrever rebentava com `permission-denied`. A leitura fica
 * (`allow read: if autenticado()`) — é o painel que lista as promoções, os
 * permitidos e os usos.
 *
 * `create`, `update` e `delete` do motor são excluídos do contrato de
 * propósito. A classe herda-os do `BaseFirebaseDAO`, mas quem a consome vê
 * este tipo e não lhes chega.
 */
export interface IPromotionRepository
  extends Omit<
    IBaseRepository<PromotionEntity>,
    'create' | 'update' | 'delete'
  > {
  /** Atalho de leitura — o código normalizado é o id do documento. */
  getByCode(code: string): Promise<PromotionEntity | null>

  /** Lista de permitidos (subcolecção — evita o limite de 1MB de um array). */
  listAllowedUsers(code: string): Promise<AllowedUser[]>

  /** Usos da promoção — leitura para o detalhe. */
  listUsages(code: string, limit?: number): Promise<PromotionUsageEntity[]>
}
