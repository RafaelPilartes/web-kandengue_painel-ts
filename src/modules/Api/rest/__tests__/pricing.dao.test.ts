import { describe, it, expect, vi, beforeEach } from 'vitest'

const get = vi.fn()
const put = vi.fn()
const del = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { get, put, delete: del }
}))

const { PricingDAO } = await import('@/modules/Api/rest/pricing.dao')

// Os perfis e as regras escrevem-se pela API (validação da lib, versão e
// auditoria na mesma transacção), nunca directamente no Firestore.
describe('PricingDAO', () => {
  const dao = new PricingDAO()

  beforeEach(() => {
    get.mockReset()
    put.mockReset()
    del.mockReset()
  })

  it('listProfiles lê a rota de admin e converte as datas', async () => {
    get.mockResolvedValue({
      profiles: [
        {
          id: 'AO-LUA_delivery_motorcycle',
          ride_type: 'delivery',
          vehicle_type: 'motorcycle',
          active: true,
          version: 2,
          created_at: '2026-09-29T10:58:22.274Z',
          updated_at: '2026-09-30T08:00:00.000Z'
        }
      ]
    })

    const profiles = await dao.listProfiles()

    expect(get).toHaveBeenCalledWith('/api/v1/admin/pricing/profiles')
    expect(profiles).toHaveLength(1)
    expect(profiles[0].id).toBe('AO-LUA_delivery_motorcycle')
    expect(profiles[0].created_at).toBeInstanceOf(Date)
    expect(profiles[0].updated_at?.toISOString()).toBe('2026-09-30T08:00:00.000Z')
  })

  it('saveProfile faz PUT do corpo tal como está e devolve o perfil gravado', async () => {
    const input = {
      region: 'AO-LUA',
      ride_type: 'delivery' as const,
      vehicle_type: 'car' as const,
      rate_bands: [],
      min_fare: 0,
      insurance_percent: 5,
      payouts: { driver_percent: 80, company_percent: 15, pension_fund_percent: 5 },
      max_surcharge_percent: 100,
      utc_offset_minutes: 60,
      active: false,
      note: 'criado no painel'
    }
    put.mockResolvedValue({ ...input, id: 'AO-LUA_delivery_car', version: 1 })

    const saved = await dao.saveProfile(input)

    expect(put).toHaveBeenCalledWith('/api/v1/admin/pricing/profiles', input)
    expect(saved.id).toBe('AO-LUA_delivery_car')
    expect(saved.version).toBe(1)
  })

  it('listRules converte as datas de validade', async () => {
    get.mockResolvedValue({
      rules: [
        { id: 'rain', name: 'Chuva', active: true, version: 1, valid_until: '2026-12-31T00:00:00.000Z' },
        { id: 'peak', name: 'Ponta', active: true, version: 1 }
      ]
    })

    const rules = await dao.listRules()

    expect(get).toHaveBeenCalledWith('/api/v1/admin/pricing/rules')
    expect(rules[0].valid_until).toBeInstanceOf(Date)
    expect(rules[1].valid_until).toBeUndefined()
  })

  it('saveRule faz PUT e deleteRule faz DELETE na rota da regra', async () => {
    put.mockResolvedValue({ id: 'rain', name: 'Chuva', version: 2 })
    del.mockResolvedValue({ deleted: true })

    const saved = await dao.saveRule({ id: 'rain', name: 'Chuva' } as never)
    const deleted = await dao.deleteRule('rain')

    expect(put).toHaveBeenCalledWith('/api/v1/admin/pricing/rules', { id: 'rain', name: 'Chuva' })
    expect(saved.version).toBe(2)
    expect(del).toHaveBeenCalledWith('/api/v1/admin/pricing/rules/rain')
    expect(deleted).toEqual({ deleted: true })
  })
})
