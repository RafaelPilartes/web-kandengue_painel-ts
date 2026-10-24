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
 * O que se cobra ao cliente, numa corrida em qualquer estado.
 *
 * ── ⚠️ Porque é que isto existe ──
 * Sete ecrãs do painel liam `ride.fare?.total ?? 0`, e o `fare` é escrito
 * **só no fecho** (`onRideUpdated`, com o `fare_finalized_at`). Uma corrida a
 * decorrer não o tem, logo o painel mostrava **0 AOA** em todas elas —
 * medido na `rid-1792515616580_f3a28d3d`, que tinha
 * `estimated_fare.total` = 5589.
 *
 * ⚠️ **A precedência é a mesma das duas apps**, e tem de ser: o
 * `rideFareOnScreen` do passageiro e o `resolveFareDisplay` do motorista
 * decidem assim — o `fare` do servidor quando existe, a estimativa aceite
 * enquanto não existe. Três implementações da mesma regra é o que esta
 * entrada admite ter; o certo é uma na lib, e está nos pendentes.
 *
 * ⚠️ **A estimativa lê-se pelo `resolveEstimatedFare` da lib**, nunca pelo
 * `estimated_fare.total` cru: o significado do `total` mudou na 2.10.0 (ver a
 * nota do `compareQuotedToCharged`).
 */
export type RideChargeOnScreen = {
  /** O número a mostrar. */
  total: number
  /** `true` enquanto o servidor não fechou a tarifa. */
  provisional: boolean
  /** `true` quando não há nem `fare` nem estimativa — aí o zero é honesto. */
  unknown: boolean
}

export function rideChargeOnScreen(
  ride: Pick<RideEntity, 'fare' | 'estimated_fare'> | null | undefined
): RideChargeOnScreen {
  const settled = ride?.fare?.total

  if (typeof settled === 'number' && Number.isFinite(settled)) {
    return { total: settled, provisional: false, unknown: false }
  }

  if (ride?.estimated_fare) {
    return {
      total: resolveEstimatedFare(ride.estimated_fare).total,
      provisional: true,
      unknown: false
    }
  }

  return { total: 0, provisional: true, unknown: true }
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

/**
 * Esta corrida foi marcada pelo servidor, por qualquer motivo?
 *
 * ⚠️ **Qualquer marca conta, e nunca se enumeram.** Das cinco marcas que a lib
 * tem, a fila lia **uma** (`promotion_reservation_failed`) — e as outras quatro
 * (`driver_ended_early`, `force_completed`, `completed_location_mismatch`,
 * `fare_estimated_fallback`) eram escritas pelo servidor e **não chegavam a
 * ecrã nenhum**. Uma corrida forçada a concluída por um admin ficava invisível.
 *
 * A pergunta aqui é "o servidor marcou isto?", não "qual das marcas é" — e é
 * por isso que é um teste de lista vazia e não uma lista de valores.
 */
export function hasAnyReviewFlag(
  ride: Pick<RideEntity, 'review_flags'>
): boolean {
  return (ride.review_flags ?? []).length > 0
}

/**
 * O que se mostra ao operador por cada marca.
 *
 * ⚠️ **Não é um `Record<RideReviewFlag, string>`, e é uma regra do painel.**
 * Um `Record` exaustivo obriga o compilador a exigir uma entrada por marca — e
 * com isso **acrescentar uma marca à lib passava a ser uma alteração major**,
 * porque partia a compilação daqui. Com um mapa parcial e um valor por defeito,
 * uma marca nova aparece no ecrã com o nome cru e ninguém fica bloqueado: a
 * etiqueta escreve-se quando houver tempo, não quando a lib sobe.
 *
 * O nome cru não é bonito, e é melhor do que a alternativa: uma corrida
 * marcada que não aparece, ou uma lib que não pode crescer.
 */
const REVIEW_FLAG_LABELS: Record<string, string> = {
  promotion_reservation_failed: 'Promoção não reservada',
  driver_ended_early: 'Terminada antes do destino',
  force_completed: 'Fecho forçado por um admin',
  completed_location_mismatch: 'Posição final em desacordo com o percurso',
  fare_estimated_fallback: 'Cobrada pela distância estimada'
}

/** A etiqueta da marca, ou o próprio nome dela se for nova. */
export function reviewFlagLabel(flag: string): string {
  return REVIEW_FLAG_LABELS[flag] ?? flag
}

/**
 * What each flag **means**, and what the operator does about it.
 *
 * ── Why the label is not enough ──
 * "Cobrada pela distância estimada" says what happened and not **what to do**.
 * Whoever works the review queue needs to know whether the fare is wrong (and
 * has to be corrected) or right but simply not measured — those are different
 * conversations with the passenger. Until now that difference lived in the
 * HANDOFF, and the operator does not read the HANDOFF.
 *
 * ⚠️ **A partial map, like the labels** (panel rule, §0AB): a new flag shows up
 * on screen without an explanation instead of breaking the build. An
 * exhaustive `Record<RideReviewFlag, …>` turned every new flag in the lib into
 * a **major** change.
 *
 * The strings themselves are user-facing, so they stay in Portuguese.
 */
const REVIEW_FLAG_EXPLANATIONS: Record<string, string> = {
  promotion_reservation_failed:
    'A promoção esgotou-se entre a cotação e a criação da corrida: o cliente viu um preço com desconto e a corrida nasceu sem ele. A tarifa está certa pelas regras — o que falta é decidir se se devolve a diferença.',
  driver_ended_early:
    'O motorista terminou antes do destino, com motivo (o passageiro foi avisado). Cobrou-se até onde a corrida parou. Vale confirmar que o motivo justifica o valor.',
  force_completed:
    'Um administrador fechou esta corrida à força — ela não foi terminada por ninguém no terreno. O motivo está na auditoria, abaixo. A tarifa saiu quase sempre da distância estimada.',
  completed_location_mismatch:
    'A posição final da corrida afastou-se do último ponto do percurso gravado: ou o percurso parou de gravar a meio, ou a corrida não acabou onde diz. As duas coisas mudam a distância cobrada.',
  fare_estimated_fallback:
    'O percurso gravado não dava para medir (poucos pontos, um salto de GPS, o início longe da recolha), por isso cobrou-se a distância **estimada** da cotação. A tarifa está certa pelas regras e **não foi medida** — o motivo exacto está em `fare.distance.reason`.'
}

/** The flag's explanation, or `null` when none has been written yet. */
export function reviewFlagExplanation(flag: string): string | null {
  return REVIEW_FLAG_EXPLANATIONS[flag] ?? null
}

/**
 * The reason behind a forced close, read from the audit log.
 *
 * ⚠️ **It reads `new_data.reason`, not the sentence.** The API writes both: the
 * `description` ("Forçou o fecho da corrida X (estava em Y): reason") and
 * `new_data: {status, review_flags, reason}`. Going to the structured field is
 * what makes this immune to a rewording — and `description` changes over time,
 * like any sentence.
 *
 * Returns `null` when there is no entry at all: it may be a ride flagged
 * before the audit log existed, or a read that failed. **Showing "no reason on
 * record" beats hiding the flag.**
 */
export function forcedCloseReason(
  logs: ReadonlyArray<{
    action?: string
    module?: string
    new_data?: unknown
  }>
): string | null {
  for (const log of logs) {
    if (log.module !== 'rides') continue
    const data = log.new_data as
      | { reason?: unknown; review_flags?: unknown }
      | null
      | undefined
    const flags = data?.review_flags
    const hasFlag = Array.isArray(flags) && flags.includes('force_completed')
    const reason = typeof data?.reason === 'string' ? data.reason.trim() : ''
    if (hasFlag && reason !== '') return reason
  }
  return null
}
