import type {
  PricingProfileInterface,
  PricingRuleInterface,
  WeatherStateInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import type {
  WeatherCondition
} from '@rafaelpilartes/kandengue-shared/types'

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

/**
 * O que o `GET /admin/pricing/weather` devolve: o documento da região e o
 * que o motor **resolve agora** a partir dele.
 *
 * São duas coisas diferentes e é por isso que vêm as duas. O documento diz o
 * que foi medido e o que foi forçado; o `resolved` diz qual dos dois está a
 * contar neste instante — a chuva manual expira sozinha, e uma leitura
 * automática velha deixa de valer.
 */
export interface WeatherView {
  state: WeatherStateInterface | null
  resolved: { condition: WeatherCondition; source: 'manual' | 'auto' | 'default' }
}

export interface WeatherOverrideInput {
  condition: WeatherCondition
  /** Omitido → 2 h. A API recusa acima de 6 h. */
  duration_minutes?: number
  reason?: string
  region?: string
}

export interface IPricingRepository {
  listProfiles(): Promise<PricingProfileInterface[]>
  saveProfile(input: PricingProfileInput): Promise<PricingProfileInterface>

  listRules(): Promise<PricingRuleInterface[]>
  saveRule(input: PricingRuleInput): Promise<PricingRuleInterface>
  deleteRule(ruleId: string): Promise<{ deleted: boolean }>

  /** Estado do clima da região e o que o motor resolve agora. */
  getWeather(region?: string): Promise<WeatherView>
  /** Activa a chuva manual. A duração é validada no servidor. */
  setWeatherOverride(input: WeatherOverrideInput): Promise<WeatherStateInterface>
  /** Volta ao automático antes de a chuva manual expirar. */
  clearWeatherOverride(region?: string): Promise<WeatherStateInterface>
}
