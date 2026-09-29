import type {
  PricingProfileInterface,
  PricingRuleInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'

/**
 * Perfis de preço e regras de acréscimo. Escrevem-se pela API, nunca no
 * Firestore directamente: é lá que a validação da lib corre outra vez, a
 * `version` é incrementada e a auditoria (`pricingAuditLogs`) fica na
 * mesma transacção. O id do perfil é derivado dos três segmentos no
 * servidor — o painel não o envia.
 *
 * Nenhuma operação recebe `adminId`: a API tira-o do ID token verificado.
 */
export type PricingProfileInput = Omit<
  PricingProfileInterface,
  'id' | 'version' | 'updated_by' | 'created_at' | 'updated_at'
> & { note?: string }

export type PricingRuleInput = Omit<
  PricingRuleInterface,
  'id' | 'version' | 'updated_by' | 'created_at' | 'updated_at'
> & { id?: string; note?: string }

export interface IPricingRepository {
  listProfiles(): Promise<PricingProfileInterface[]>
  saveProfile(input: PricingProfileInput): Promise<PricingProfileInterface>

  listRules(): Promise<PricingRuleInterface[]>
  saveRule(input: PricingRuleInput): Promise<PricingRuleInterface>
  deleteRule(ruleId: string): Promise<{ deleted: boolean }>
}
