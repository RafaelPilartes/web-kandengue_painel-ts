import type {
  PromotionRules,
  ReferralConfig
} from '@rafaelpilartes/kandengue-shared/interfaces'
import type { PromotionType } from '@rafaelpilartes/kandengue-shared/types'

/**
 * Escrita de promoções. Corre no servidor e fica em `auditLogs` com o antes e
 * o depois de cada campo que mudou, na mesma transacção da alteração.
 *
 * `promotions` e tudo o que está por baixo saíram do alcance do cliente nas
 * regras, **admin incluído** — era a última escrita de admin do painel feita
 * directamente no Firestore. Promoções são dinheiro: o que aqui se grava
 * decide quanto se desconta, a quem e até quando.
 *
 * A **leitura** continua no `IPromotionRepository` (Firestore directo): as
 * regras mantêm `allow read: if autenticado()`, e um `onSnapshot` não se
 * substitui por REST.
 */
export interface PromotionWriteResult {
  code: string
  /** `false` quando o pedido não muda nada — não é erro, e não audita. */
  changed: boolean
  changed_fields: string[]
}

export interface AllowedUsersResult {
  code: string
  /** Os que não estavam lá antes. Colar o mesmo CSV outra vez dá zero. */
  added: number
  already_present: number
}

/**
 * O que o formulário edita.
 *
 * ⚠️ Não leva `used_count_approx`, `reserved_count_approx`, `created_by` nem
 * `created_at`: são do servidor. O schema da API retira-os do corpo se vierem
 * — a protecção já não está no cliente.
 *
 * ⚠️ **Na edição, um opcional ausente é um opcional apagado** — é o que o
 * `deleteField()` do DAO antigo fazia, e o que permite ao admin limpar um
 * tecto de desconto em vez de só o aumentar.
 */
export interface PromotionPayload {
  type: PromotionType
  value: number
  max_discount?: number
  min_ride_value?: number
  usage_limit_total?: number
  usage_limit_per_user?: number
  valid_from: Date
  valid_until: Date
  active: boolean
  rules: PromotionRules
  referral?: ReferralConfig
}

export interface CreatePromotionPayload extends PromotionPayload {
  code: string
}

export interface IAdminPromotionRepository {
  create(payload: CreatePromotionPayload): Promise<PromotionWriteResult>

  update(
    code: string,
    payload: PromotionPayload
  ): Promise<PromotionWriteResult>

  /**
   * Rota própria, e não um `update` com um campo só: o corpo do `update` é a
   * superfície editável inteira, e mandar lá `{ active }` apagava todos os
   * opcionais.
   */
  setActive(code: string, active: boolean): Promise<PromotionWriteResult>

  /**
   * A API aceita 400 por pedido (uma transacção leva 500 escritas, e esta
   * gasta uma por utilizador mais a da auditoria). O DAO parte a lista e soma
   * os resultados.
   */
  addAllowedUsers(
    code: string,
    userIds: string[]
  ): Promise<AllowedUsersResult>

  removeAllowedUser(
    code: string,
    userId: string
  ): Promise<{ code: string; removed: boolean }>
}
