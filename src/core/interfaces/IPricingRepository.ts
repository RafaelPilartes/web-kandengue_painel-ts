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
/**
 * A pricing profile as the panel reads it.
 *
 * ⚠️ **`prices_need_review` is not in the lib, and that is deliberate.** The
 * field is written by `seed-pricing-profiles-by-region.mjs` straight onto the
 * document, and the API never names it: `mapProfile` spreads the whole
 * document and the response schema is a `z.looseObject({})`, so it reaches
 * here untouched. Putting it in the lib would force choosing one of the three
 * live lines (API on 2.15.0, panel on 3.1.0, `main` on 4.0.0) — see
 * `decisions.md`, 2026-10-24.
 *
 * ⚠️ **And the mark clears itself on a save.** `profileBodySchema` on the API
 * is a closed `z.object`, so zod strips the field out of the body, and
 * `saveProfile` writes with `tx.set` and **no merge** — the saved document
 * simply no longer has it. Nothing in the panel has to clear it, and nothing
 * should try: sending it back would be the one way to keep it alive.
 */
export type PricingProfileView = PricingProfileInterface & {
  prices_need_review?: boolean
}

/**
 * A province, from `GET /api/v1/admin/regions`.
 *
 * `group` is the **operating area**, not the province: Luanda and Icolo e
 * Bengo share `grande-luanda` because the Dr. António Agostinho Neto airport
 * sits in Icolo e Bengo and not in Luanda. `provisional` marks the three
 * codes that are ours, because ISO 3166-2:AO has not caught up with the 2024
 * split.
 */
export interface AdminRegion {
  code: string
  name: string
  group: string | null
  provisional: boolean
  /** How many of Google's spellings reach this province. */
  alias_count: number
}

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
  listProfiles(): Promise<PricingProfileView[]>
  saveProfile(input: PricingProfileInput): Promise<PricingProfileInterface>

  /** The 21 provinces, for grouping the prices page. Admin token only. */
  listRegions(): Promise<AdminRegion[]>

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
