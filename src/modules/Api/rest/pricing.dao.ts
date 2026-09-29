import ApiDAO from './Api.dao'
import type {
  IPricingRepository,
  PricingProfileInput,
  PricingRuleInput
} from '@/core/interfaces/IPricingRepository'
import type {
  PricingProfileInterface,
  PricingRuleInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'

// A API serializa as datas em ISO; aqui voltam a ser Date.
const toDate = (value: unknown): Date | undefined => {
  if (value instanceof Date) return value
  if (typeof value === 'string' && value) return new Date(value)
  return undefined
}

function mapProfile(raw: Record<string, unknown>): PricingProfileInterface {
  return {
    ...(raw as unknown as PricingProfileInterface),
    created_at: toDate(raw.created_at),
    updated_at: toDate(raw.updated_at)
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

export class PricingDAO implements IPricingRepository {
  async listProfiles(): Promise<PricingProfileInterface[]> {
    const response = await ApiDAO.get<{ profiles: Record<string, unknown>[] }>(
      '/api/v1/admin/pricing/profiles'
    )
    return (response.profiles ?? []).map(mapProfile)
  }

  async saveProfile(input: PricingProfileInput): Promise<PricingProfileInterface> {
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

  async deleteRule(ruleId: string): Promise<{ deleted: boolean }> {
    return ApiDAO.delete<{ deleted: boolean }>(
      `/api/v1/admin/pricing/rules/${encodeURIComponent(ruleId)}`
    )
  }
}
