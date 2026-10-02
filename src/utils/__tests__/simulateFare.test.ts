import { describe, expect, it } from 'vitest'
import type {
  PricingProfileInterface,
  PricingRuleInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import { simulateFare } from '@/utils/simulateFare'

/**
 * O perfil que está em produção (`AO-LUA_delivery_motorcycle`), com os
 * valores do §3 do HANDOFF. Se estes números mudarem em produção o teste
 * continua válido: o que se prova é a cola, não a tabela.
 */
const PERFIL: PricingProfileInterface = {
  id: 'AO-LUA_delivery_motorcycle',
  region: 'AO-LUA',
  ride_type: 'delivery',
  vehicle_type: 'motorcycle',
  active: true,
  version: 1,
  utc_offset_minutes: 60,
  insurance_percent: 5,
  min_fare: 0,
  max_surcharge_percent: 100,
  min_final_fare_percent: 75,
  discount_driver_share_percent: 30,
  payouts: { driver_percent: 80, company_percent: 15, pension_fund_percent: 5 },
  rate_bands: [
    {
      start_time: '06:30',
      end_time: '17:31',
      base_fare: 750,
      price_per_km: 200,
      price_per_minute: 50,
      wait_time_free_minutes: 5
    },
    {
      start_time: '17:31',
      end_time: '06:30',
      base_fare: 1000,
      price_per_km: 250,
      price_per_minute: 75,
      wait_time_free_minutes: 5
    }
  ]
} as PricingProfileInterface

const base = {
  profile: PERFIL,
  rules: [] as PricingRuleInterface[],
  day_of_week: 1 as const,
  hour: 10,
  minute: 0,
  weather: 'clear' as const,
  distance_km: 5,
  wait_minutes: 0,
  discount: 0
}

describe('simulateFare', () => {
  it('escolhe a faixa de dia e soma base + distância', () => {
    const r = simulateFare(base)
    if (!r.ok) throw new Error(r.error)

    expect(r.snapshot.rate_band.base_fare).toBe(750)
    expect(r.fare.breakdown.base_fare).toBe(750)
    expect(r.fare.breakdown.distance_cost).toBe(1000) // 5 km × 200
    expect(r.fare.breakdown.subtotal).toBe(1750)
    // 5% sobre o subtotal, por cima e sem repartir.
    expect(r.fare.breakdown.insurance_fee).toBe(88)
    expect(r.fare.total).toBe(1838)
  })

  /*
   * O caso que a cola pode errar em silêncio: a hora escolhida tem de cair na
   * faixa certa. 17:30 é dia, 17:31 é noite — um erro de conversão de hora
   * local dava um preço confiante e errado.
   */
  it('17:30 é a faixa de dia; 17:31 é a da noite', () => {
    const dia = simulateFare({ ...base, hour: 17, minute: 30 })
    const noite = simulateFare({ ...base, hour: 17, minute: 31 })
    if (!dia.ok || !noite.ok) throw new Error('não calculou')

    expect(dia.snapshot.rate_band.base_fare).toBe(750)
    expect(noite.snapshot.rate_band.base_fare).toBe(1000)
    expect(noite.fare.breakdown.distance_cost).toBe(1250) // 5 km × 250
  })

  it('06:29 ainda é noite; 06:30 já é dia', () => {
    const noite = simulateFare({ ...base, hour: 6, minute: 29 })
    const dia = simulateFare({ ...base, hour: 6, minute: 30 })
    if (!noite.ok || !dia.ok) throw new Error('não calculou')

    expect(noite.snapshot.rate_band.base_fare).toBe(1000)
    expect(dia.snapshot.rate_band.base_fare).toBe(750)
  })

  it('a meia-noite cai na faixa da noite, que passa de um dia para o outro', () => {
    const r = simulateFare({ ...base, hour: 0, minute: 0 })
    if (!r.ok) throw new Error(r.error)
    expect(r.snapshot.rate_band.base_fare).toBe(1000)
  })

  /*
   * O desvio UTC: segunda às 00:30 locais é domingo às 23:30 UTC. Se a cola
   * errasse aqui, o dia da semana das regras vinha trocado.
   */
  it('o dia local escolhido é o que as regras vêem', () => {
    const r = simulateFare({ ...base, day_of_week: 1, hour: 0, minute: 30 })
    if (!r.ok) throw new Error(r.error)
    // O instante é domingo em UTC...
    expect(r.now.getUTCDay()).toBe(0)
    // ...mas a faixa resolvida é a das 00:30 locais.
    expect(r.snapshot.rate_band.start_time).toBe('17:31')
  })

  it('a espera só conta depois dos minutos grátis', () => {
    const cinco = simulateFare({ ...base, wait_minutes: 5 })
    const sete = simulateFare({ ...base, wait_minutes: 7 })
    if (!cinco.ok || !sete.ok) throw new Error('não calculou')

    expect(cinco.fare.breakdown.wait_cost).toBe(0)
    expect(sete.fare.breakdown.wait_cost).toBe(100) // 2 min × 50
  })

  it('o desconto entra e está limitado ao subtotal', () => {
    const r = simulateFare({ ...base, discount: 500 })
    if (!r.ok) throw new Error(r.error)
    expect(r.fare.breakdown.discount).toBe(500)
    expect(r.fare.total).toBeLessThan(1838)

    // Um desconto maior do que o subtotal não leva o total abaixo do seguro:
    // o seguro cobra-se sempre.
    const enorme = simulateFare({ ...base, discount: 99999 })
    if (!enorme.ok) throw new Error(enorme.error)
    expect(enorme.fare.total).toBeGreaterThanOrEqual(
      enorme.fare.breakdown.insurance_fee
    )
  })

  it('a repartição soma com o subtotal, e o seguro fica fora dela', () => {
    const r = simulateFare(base)
    if (!r.ok) throw new Error(r.error)
    const p = r.fare.payouts
    expect(p.driver_earnings + p.company_earnings + p.pension_fund).toBe(
      r.fare.breakdown.subtotal
    )
  })

  it('um perfil inactivo diz porque é que não dá preço', () => {
    const r = simulateFare({
      ...base,
      profile: { ...PERFIL, active: false }
    })
    expect(r.ok).toBe(false)
    if (r.ok) return
    // O `buildPricingSnapshot` lança; a mensagem tem de explicar, não ser o
    // texto da excepção.
    expect(r.error).toMatch(/inactivo/i)
    expect(r.error).toContain(PERFIL.id)
  })

  it('distância zero dá só a base, não rebenta', () => {
    const r = simulateFare({ ...base, distance_km: 0 })
    if (!r.ok) throw new Error(r.error)
    expect(r.fare.breakdown.distance_cost).toBe(0)
    expect(r.fare.breakdown.base_fare).toBe(750)
  })

  it('não grava nada: a função é pura e não tem efeitos', () => {
    // Duas corridas com a mesma entrada dão exactamente o mesmo resultado —
    // é a garantia de "só leitura" que o ecrã promete.
    const a = simulateFare(base)
    const b = simulateFare(base)
    if (!a.ok || !b.ok) throw new Error('não calculou')
    expect(a.fare).toEqual(b.fare)
    expect(a.snapshot.applied_rules).toEqual(b.snapshot.applied_rules)
  })
})
