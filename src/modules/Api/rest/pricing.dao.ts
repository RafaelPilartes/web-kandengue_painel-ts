import ApiDAO from './Api.dao'
import type {
  AdminRegion,
  IPricingRepository,
  PricingProfileInput,
  PricingProfileView,
  PricingRuleInput,
  WeatherOverrideInput,
  WeatherView
} from '@/core/interfaces/IPricingRepository'
import type {
  PricingProfileInterface,
  PricingRuleInterface,
  WeatherStateInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'

// A API serializa as datas em ISO; aqui voltam a ser Date.
const toDate = (value: unknown): Date | undefined => {
  if (value instanceof Date) return value
  if (typeof value === 'string' && value) return new Date(value)
  return undefined
}

function mapProfile(raw: Record<string, unknown>): PricingProfileView {
  return {
    ...(raw as unknown as PricingProfileView),
    created_at: toDate(raw.created_at),
    updated_at: toDate(raw.updated_at),
    /*
     * Read as a strict `=== true`, not as truthy: the field only exists on the
     * profiles the seed script created, and an absent one has to mean
     * "reviewed" and not "undefined" — the badge is a boolean on screen.
     */
    prices_need_review: raw.prices_need_review === true
  }
}

function mapRule(raw: Record<string, unknown>): PricingRuleInterface {
  return {
    ...(raw as unknown as PricingRuleInterface),
    valid_from: toDate(raw.valid_from),
    valid_until: toDate(raw.valid_until),
    created_at: toDate(raw.created_at),
    updated_at: toDate(raw.updated_at)
  }
}

/**
 * O estado do clima tem quatro datas, e a API serializa-as em ISO. Sem este
 * mapeamento, `expires_at.getTime()` no ecrã era um `TypeError` — e a conta
 * de "falta quanto tempo" é precisamente o que o ecrã mostra.
 */
type WeatherAuto = NonNullable<WeatherStateInterface['auto']>
type WeatherOverride = NonNullable<WeatherStateInterface['manual_override']>

function mapWeatherState(
  raw: Record<string, unknown> | null | undefined
): WeatherStateInterface | null {
  if (!raw) return null

  const auto = raw.auto as WeatherAuto | undefined
  const override = raw.manual_override as WeatherOverride | null | undefined

  return {
    ...(raw as unknown as WeatherStateInterface),
    ...(auto
      ? { auto: { ...auto, observed_at: toDate(auto.observed_at) as Date } }
      : {}),
    // `null` é um valor com significado aqui: "não há chuva manual". Não se
    // omite, ao contrário do `auto`.
    manual_override: override
      ? {
          ...override,
          set_at: toDate(override.set_at) as Date,
          expires_at: toDate(override.expires_at) as Date
        }
      : null,
    updated_at: toDate(raw.updated_at)
  }
}

export class PricingDAO implements IPricingRepository {
  async listRegions(): Promise<AdminRegion[]> {
    const response = await ApiDAO.get<{ regions: AdminRegion[] }>(
      '/api/v1/admin/regions'
    )
    return response.regions ?? []
  }

  async listProfiles(): Promise<PricingProfileView[]> {
    const response = await ApiDAO.get<{ profiles: Record<string, unknown>[] }>(
      '/api/v1/admin/pricing/profiles'
    )
    return (response.profiles ?? []).map(mapProfile)
  }

  async saveProfile(
    input: PricingProfileInput
  ): Promise<PricingProfileInterface> {
    const saved = await ApiDAO.put<Record<string, unknown>>(
      '/api/v1/admin/pricing/profiles',
      input
    )
    return mapProfile(saved)
  }

  async listRules(): Promise<PricingRuleInterface[]> {
    const response = await ApiDAO.get<{ rules: Record<string, unknown>[] }>(
      '/api/v1/admin/pricing/rules'
    )
    return (response.rules ?? []).map(mapRule)
  }

  async saveRule(input: PricingRuleInput): Promise<PricingRuleInterface> {
    const saved = await ApiDAO.put<Record<string, unknown>>(
      '/api/v1/admin/pricing/rules',
      input
    )
    return mapRule(saved)
  }

  async getWeather(region?: string): Promise<WeatherView> {
    const query = region ? `?region=${encodeURIComponent(region)}` : ''
    const raw = await ApiDAO.get<{
      state: Record<string, unknown> | null
      resolved: WeatherView['resolved']
    }>(`/api/v1/admin/pricing/weather${query}`)
    return { state: mapWeatherState(raw.state), resolved: raw.resolved }
  }

  async setWeatherOverride(
    input: WeatherOverrideInput
  ): Promise<WeatherStateInterface> {
    // `duration_minutes` só vai quando é escolhida: omitida, a API usa as
    // 2 h por omissão, e é lá que o máximo de 6 h é validado.
    const saved = await ApiDAO.put<Record<string, unknown>>(
      '/api/v1/admin/pricing/weather/override',
      {
        condition: input.condition,
        ...(input.region ? { region: input.region } : {}),
        ...(input.duration_minutes
          ? { duration_minutes: input.duration_minutes }
          : {}),
        ...(input.reason?.trim() ? { reason: input.reason.trim() } : {})
      }
    )
    return mapWeatherState(saved) as WeatherStateInterface
  }

  async clearWeatherOverride(region?: string): Promise<WeatherStateInterface> {
    const query = region ? `?region=${encodeURIComponent(region)}` : ''
    const saved = await ApiDAO.delete<Record<string, unknown>>(
      `/api/v1/admin/pricing/weather/override${query}`
    )
    return mapWeatherState(saved) as WeatherStateInterface
  }

  async deleteRule(ruleId: string): Promise<{ deleted: boolean }> {
    return ApiDAO.delete<{ deleted: boolean }>(
      `/api/v1/admin/pricing/rules/${encodeURIComponent(ruleId)}`
    )
  }
}
