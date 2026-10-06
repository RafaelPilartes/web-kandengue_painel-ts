import type {
  FareDistanceInterface,
  RideFareV2Interface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import { resolveEstimatedFare } from '@rafaelpilartes/kandengue-shared/functions'
import type { RideReviewFlag } from '@rafaelpilartes/kandengue-shared/types'
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

/** Os três números de um lado da comparação. */
export interface FareSide {
  /** Antes do desconto: subtotal + seguro. */
  gross: number
  /** Limitado ao subtotal — o seguro cobra-se sempre. */
  discount: number
  /** O que o cliente paga. */
  total: number
}

export interface FareComparison {
  /** `null` numa corrida sem estimativa gravada. */
  quoted: FareSide | null
  charged: FareSide
  /**
   * **A cotação tinha desconto e o fecho não aplicou nenhum.**
   *
   * É uma reserva falhada: a promoção esgotou-se entre cotar e criar a
   * corrida, o `apply` não reservou, e a corrida nasceu sem desconto. O
   * cliente viu um preço e pagou outro — mas **não é um desvio de tarifa**, e
   * era assim que o ecrã o mostrava. O `onRideCreated` avisa nos logs quando
   * há `promotion_id` sem `promotion_usage_id`.
   */
  discountNotApplied: boolean
  /**
   * Desvio do **bruto**, com sinal, em Kz. É esta a comparação que diz se a
   * tarifa se desviou: o bruto é o que o motor produziu, e não se mexe com a
   * promoção ter pegado ou não.
   */
  grossDelta: number | null
  /** Desvio do que o cliente paga, com sinal. */
  totalDelta: number | null
}

/**
 * O cotado contra o cobrado, nos três números.
 *
 * ⚠️ **Lê a estimativa pelo `resolveEstimatedFare` da lib**, e não
 * `estimated_fare.total` cru. O `total` mudou de significado na lib 2.10.0
 * (era o bruto, passou a ser o que o cliente paga) e as corridas criadas
 * antes só têm `total` — nessas o total *é* o bruto e o desconto é zero. Ler
 * o campo à mão dava um desconto que não existe, ou escondia um que existe.
 */
export function compareQuotedToCharged(
  ride: Pick<RideEntity, 'fare' | 'estimated_fare'>
): FareComparison | null {
  const fare = closedFareV2(ride)
  if (!fare) return null

  const chargedDiscount = fare.breakdown.discount ?? 0
  const charged: FareSide = {
    // O `gross_amount` é obrigatório na V2 e a app passageira escreve-o
    // sempre. O recuo é para uma corrida antiga que lhe tenha escapado: sem
    // ele, o bruto é o total mais o desconto que se tirou.
    gross: fare.breakdown.gross_amount ?? fare.total + chargedDiscount,
    discount: chargedDiscount,
    total: fare.total
  }

  const estimated = ride.estimated_fare
  if (!estimated) {
    return {
      quoted: null,
      charged,
      discountNotApplied: false,
      grossDelta: null,
      totalDelta: null
    }
  }

  const quoted = resolveEstimatedFare(estimated)

  return {
    quoted,
    charged,
    discountNotApplied: quoted.discount > 0 && chargedDiscount === 0,
    grossDelta: charged.gross - quoted.gross,
    totalDelta: charged.total - quoted.total
  }
}

/**
 * A corrida nasceu com promoção e sem reserva?
 *
 * A mesma assinatura que o `onRideCreated` usa para marcar a corrida. Serve
 * de **recuo para as corridas de antes dessa marca**: as que já estão em
 * produção não têm `review_flags`, e esta leitura apanha-as sem backfill.
 *
 * Cobre também o caso que os números não dizem: uma promoção cujo desconto
 * estava bloqueado pelo `min_ride_value` reserva sem descontar, e aí uma
 * reserva falhada não deixa diferença nenhuma nos valores.
 */
export function promotionReservationMissing(
  ride: Pick<RideEntity, 'promotion_id' | 'promotion_usage_id'>
): boolean {
  return !!ride.promotion_id && !ride.promotion_usage_id
}

/** Esta corrida tem esta marca de revisão? */
export function hasReviewFlag(
  ride: Pick<RideEntity, 'review_flags'>,
  flag: RideReviewFlag
): boolean {
  return (ride.review_flags ?? []).includes(flag)
}

/**
 * Esta corrida está marcada por uma reserva de promoção que falhou?
 *
 * Duas origens, e basta uma:
 *
 * - `review_flags` com `promotion_reservation_failed` — escrito pelo
 *   `onRideCreated`. É a autoritativa, e a única que distingue uma reserva
 *   falhada de uma corrida sem promoção nenhuma.
 * - `promotion_id` sem `promotion_usage_id` — o recuo, para as corridas
 *   criadas antes de a marca existir.
 */
export function failedReservation(
  ride: Pick<
    RideEntity,
    'review_flags' | 'promotion_id' | 'promotion_usage_id'
  >
): boolean {
  return (
    hasReviewFlag(ride, 'promotion_reservation_failed') ||
    promotionReservationMissing(ride)
  )
}
