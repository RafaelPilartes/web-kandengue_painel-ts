import type {
  FareDistanceInterface,
  RideFareV2Interface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import type { RideEntity } from '@/core/entities/Ride'

/**
 * A fronteira única entre a corrida e a tarifa fechada pelo motor novo.
 *
 * `RideInterface.fare` está declarado como `RideFareInterface` (a V1, do
 * telefone) nas versões da lib até à 2.7.5. Em produção coexistem as duas
 * formas: as corridas fechadas pelo servidor desde a v2.7.0 têm a V2, com
 * `subtotal` e `distance`; as anteriores têm a V1. A 2.8.0 corrige o tipo
 * para a união, e então este molde deixa de ser preciso — mas o helper
 * fica, porque a pergunta "esta corrida tem tarifa V2?" continua a ser uma
 * pergunta a fazer, e é melhor fazê-la num sítio do que em cinco.
 *
 * Devolve `null` para uma corrida sem tarifa ou com tarifa V1: nenhuma
 * delas tem `distance`, e por isso nenhuma pode estar em revisão.
 */
export function closedFareV2(
  ride: Pick<RideEntity, 'fare'>
): RideFareV2Interface | null {
  const fare = ride.fare as RideFareV2Interface | undefined

  if (!fare) return null
  // A V1 não tem `distance` nem `breakdown.subtotal`; é por aí que se
  // distinguem sem perguntar a versão a ninguém.
  if (!fare.distance) return null

  return fare
}

/** A distância que fechou a tarifa, ou `null` se não há tarifa V2. */
export function fareDistance(
  ride: Pick<RideEntity, 'fare'>
): FareDistanceInterface | null {
  return closedFareV2(ride)?.distance ?? null
}

/** Esta corrida está marcada para revisão de tarifa? */
export function needsFareReview(ride: Pick<RideEntity, 'fare'>): boolean {
  return fareDistance(ride)?.review_required === true
}

/**
 * Quanto é que a distância cobrada se desviou da cotada, com sinal: positivo
 * quando se cobrou mais do que o estimado, negativo quando menos.
 *
 * O `deviation_percent` gravado é absoluto (`|usada − estimada| / estimada`),
 * e para quem revê a direcção é metade da informação.
 */
export function signedDeviationPercent(
  distance: FareDistanceInterface
): number | null {
  if (distance.estimated_km <= 0) return null
  const delta = distance.used_km - distance.estimated_km
  return Math.round((delta / distance.estimated_km) * 1000) / 10
}
