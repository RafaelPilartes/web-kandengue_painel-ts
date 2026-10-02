import {
  buildPricingSnapshot,
  computeFare,
  localTimeToDate
} from '@rafaelpilartes/kandengue-shared/functions'
import type {
  PricingProfileInterface,
  PricingRuleInterface,
  PricingSnapshotInterface,
  RideFareV2Interface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import type { DayOfWeek, WeatherCondition } from '@rafaelpilartes/kandengue-shared/types'

export type SimulationInput = {
  profile: PricingProfileInterface
  rules: PricingRuleInterface[]
  day_of_week: DayOfWeek
  hour: number
  minute: number
  weather: WeatherCondition
  distance_km: number
  wait_minutes: number
  discount: number
}

export type SimulationResult =
  | { ok: true; snapshot: PricingSnapshotInterface; fare: RideFareV2Interface; now: Date }
  | { ok: false; error: string }

/**
 * O cálculo do simulador, sem React.
 *
 * É só a cola: o `buildPricingSnapshot` e o `computeFare` da lib são os
 * mesmos que o servidor corre ao cotar. Está aqui, e não dentro de um
 * `useMemo` da página, porque é isto que se pode testar — e o que se quer
 * provar é precisamente que a cola não erra: que a hora e o dia escolhidos
 * caem na faixa certa, e que os números batem com os de produção.
 */
export function simulateFare(input: SimulationInput): SimulationResult {
  const { profile } = input

  // Um perfil inactivo não é cotável, e o `buildPricingSnapshot` lança. Dizer
  // isso é mais útil do que mostrar a mensagem de erro de uma excepção.
  if (!profile.active) {
    return {
      ok: false,
      error: `O perfil ${profile.id} está inactivo — não é cotável. Um perfil inactivo não gera preço nenhum.`
    }
  }

  try {
    const now = localTimeToDate(
      {
        day_of_week: input.day_of_week,
        minute_of_day: input.hour * 60 + input.minute
      },
      profile.utc_offset_minutes
    )

    const snapshot = buildPricingSnapshot(profile, input.rules, {
      now,
      // A fonte não entra na conta; o simulador escolhe a condição.
      weather: { condition: input.weather, source: 'manual' }
    })

    const fare = computeFare(snapshot, {
      distance_km: input.distance_km,
      wait_minutes: input.wait_minutes,
      // Só se passa quando existe: a lib não aceita `undefined` explícito.
      ...(input.discount > 0 ? { discount: input.discount } : {})
    })

    return { ok: true, snapshot, fare, now }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Não foi possível calcular com estes valores.'
    }
  }
}
