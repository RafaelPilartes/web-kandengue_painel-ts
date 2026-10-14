import { useEffect, useMemo, useState } from 'react'
import { Spinner } from 'phosphor-react'
import swal from 'sweetalert'
import { CheckCircle2, Info, TicketPercent } from 'lucide-react'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BadgeSimple } from '@/components/badge/BadgeSimple'
import { FareReviewMap } from './FareReviewMap'

import { useRidesViewModel } from '@/viewModels/RideViewModel'
import type { RideEntity } from '@/core/entities/Ride'
import {
  compareQuotedToCharged,
  failedReservation,
  hasAnyReviewFlag,
  forcedCloseReason,
  reviewFlagExplanation,
  reviewFlagLabel,
  fareDistance,
  signedDeviationPercent
} from '@/helpers/fareReview'
import type { FareComparison } from '@/helpers/fareReview'
import type { RideReviewFlag } from '@rafaelpilartes/kandengue-shared/types'
import { mapApiError, stripMarkdown } from '@/helpers/apiError'
import { auditService } from '@/observability/audit'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { formatMoney } from '@/utils/number'
import {
  FARE_DISTANCE_SOURCE_LABELS,
  TRACK_END_REFERENCE_LABELS,
  TRACK_UNRELIABLE_REASON_HINTS,
  TRACK_UNRELIABLE_REASON_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import { RIDE_TYPE_LABELS, VEHICLE_TYPE_LABELS } from '@rafaelpilartes/kandengue-shared/constants'

/**
 * As corridas cujo fecho de tarifa pede confirmação humana.
 *
 * Marca-as o servidor, no `resolveFareDistance`: ou o desvio entre a
 * distância cobrada e a cotada passou os 40 %, ou o percurso acabou longe do
 * destino pedido sem a app ter gravado onde concluiu.
 *
 * **Esta fase não altera tarifas.** "Marcar como revista" só registra quem
 * olhou e quando — as regras negam ao cliente, admin incluído, tocar no
 * `fare`.
 */
/**
 * Os motivos por que uma corrida cai neste ecrã, e o filtro que os separa.
 *
 * Dois motivos, escritos em momentos diferentes: a **distância** no fecho da
 * tarifa (`fare.distance.review_required`), e a **reserva falhada** na criação
 * (`review_flags`). Uma corrida pode ter os dois.
 */
type ReviewReasonFilter = 'all' | 'distance' | 'reservation' | 'flags'

const REASON_FILTERS: Array<{ key: ReviewReasonFilter; label: string }> = [
  { key: 'all', label: 'Todos os motivos' },
  { key: 'distance', label: 'Desvio de distância' },
  { key: 'reservation', label: 'Reservas falhadas' },
  /*
   * ⚠️ **As marcas do servidor, que até aqui não apareciam.** Sem este botão o
   * "Todas" contava corridas que nenhum dos outros filtros explicava — e o
   * comentário deste ficheiro já avisava desse erro: uma lista com um número
   * que não bate com as linhas.
   */
  { key: 'flags', label: 'Marcadas pelo servidor' }
]

export function FareReviewPage() {
  const [onlyPending, setOnlyPending] = useState(true)
  const [reason, setReason] = useState<ReviewReasonFilter>('all')

  /*
   * Uma query só, e os dois motivos peneirados em memória.
   *
   * Nem `fare.distance.review_required` nem `review_flags` estão indexados, e
   * **nenhum precisa de estar**: a query é a mesma de sempre
   * (`status == 'completed'` ordenado por `created_at`, índice que já existe)
   * e os dois filtros correm sobre as 500 corridas que ela traz. São dezenas,
   * não milhares — é o mesmo que o `expireStalePresence` faz pela mesma razão.
   *
   * Acrescentar o filtro das reservas falhadas **não acrescentou índice
   * nenhum**, e é por isto.
   */
  const { rides, isLoadingRides, markFareReviewed } = useRidesViewModel(
    500,
    0,
    undefined,
    { status: 'completed' } as Partial<RideEntity>
  )

  const flagged = useMemo(() => {
    const withReview = rides.filter(ride => {
      const byDistance = fareDistance(ride)?.review_required === true
      const byReservation = failedReservation(ride)
      /*
       * ⚠️ **Qualquer marca conta.** A fila lia o `review_required` e **uma**
       * das cinco marcas da lib; as outras quatro eram escritas pelo servidor
       * e não chegavam a ecrã nenhum — uma corrida forçada a concluída por um
       * admin ficava invisível. Aqui a pergunta é "o servidor marcou isto?".
       */
      const byFlags = hasAnyReviewFlag(ride)

      if (reason === 'distance') return byDistance
      if (reason === 'reservation') return byReservation
      if (reason === 'flags') return byFlags
      return byDistance || byReservation || byFlags
    })

    const visible = onlyPending
      ? withReview.filter(ride => !ride.fare_reviewed_by)
      : withReview

    // As mais recentes primeiro: ao contrário da fila de viaturas, aqui o que
    // interessa é o que acabou de acontecer.
    return visible.sort(
      (a, b) =>
        (b.completed_at?.getTime() ?? 0) - (a.completed_at?.getTime() ?? 0)
    )
  }, [rides, onlyPending, reason])

  /** Quantas há de cada motivo, para os botões do filtro não mentirem. */
  /*
   * With lib 3.0.0 installed, `RideReviewFlag` carries all five values and the
   * comparison is typed again — the `as string` casts that stood here while
   * the panel was pinned to 2.11.0 (where the type had a single value) are
   * gone.
   *
   * The labels and the explanations stay `Record<string, string>` on purpose:
   * that is the §0AB rule, and it is what keeps a new flag in the lib from
   * being a major change for the panel.
   */
  const FORCED_CLOSE_FLAG: RideReviewFlag = 'force_completed'

  /*
   * The reason behind each forced close, read from the audit log
   * (`new_data.reason`).
   *
   * ⚠️ **Only for the rides that carry the flag**, and one read per ride: the
   * queue shows dozens of rows and the audit log is not read whole to find a
   * handful of reasons. `undefined` = not read yet; `null` = read and there
   * was none — and the screen **says so** instead of hiding the flag.
   */
  const [closeReasons, setCloseReasons] = useState<
    Record<string, string | null>
  >({})

  useEffect(() => {
    const forced = flagged
      .filter(r => (r.review_flags ?? []).includes(FORCED_CLOSE_FLAG))
      .map(r => r.id as string)
      .filter(id => !(id in closeReasons))

    if (forced.length === 0) return

    let alive = true
    void Promise.all(
      forced.map(async id => {
        try {
          const logs = await auditService.getByTarget(id)
          return [id, forcedCloseReason(logs)] as const
        } catch (error) {
          // Uma falha a ler a auditoria não pode tirar a corrida da fila.
          console.error('[fare-review] forced close reason', error)
          return [id, null] as const
        }
      })
    ).then(pairs => {
      if (!alive) return
      setCloseReasons(previous => ({
        ...previous,
        ...Object.fromEntries(pairs)
      }))
    })

    return () => {
      alive = false
    }
  }, [flagged, closeReasons])

  const counts = useMemo(() => {
    const pending = (ride: RideEntity) =>
      !onlyPending || !ride.fare_reviewed_by

    const distance = rides.filter(
      r => pending(r) && fareDistance(r)?.review_required === true
    ).length
    const reservation = rides.filter(
      r => pending(r) && failedReservation(r)
    ).length
    const flags = rides.filter(r => pending(r) && hasAnyReviewFlag(r)).length
    const all = rides.filter(
      r =>
        pending(r) &&
        (fareDistance(r)?.review_required === true ||
          failedReservation(r) ||
          hasAnyReviewFlag(r))
    ).length

    return { all, distance, reservation, flags }
  }, [rides, onlyPending])

  const itemsBreadcrumbs = [
    { label: 'Início', to: '/' },
    { label: 'Revisão de tarifas' }
  ]

  async function handleMarkReviewed(ride: RideEntity) {
    const willMark = await swal({
      title: 'Marcar como revista?',
      text: 'Não altera a tarifa — só registra que foi vista, e por quem.',
      content: {
        element: 'textarea',
        attributes: {
          placeholder: 'Nota (opcional): o que concluiu',
          rows: 3,
          id: 'fare-review-note'
        }
      },
      buttons: ['Cancelar', 'Marcar'],
      icon: 'info'
    })

    if (!willMark) return

    const textarea = document.getElementById(
      'fare-review-note'
    ) as HTMLTextAreaElement | null
    const note = textarea?.value.trim() || undefined

    try {
      const result = await markFareReviewed.mutateAsync({
        id: ride.id as string,
        note
      })

      swal(
        result.changed ? 'Marcada como revista' : 'Já estava marcada',
        { icon: result.changed ? 'success' : 'info' }
      )
    } catch (error) {
      /*
       * ⚠️ **`mapApiError`, not `error.message`.** Found by the independent
       * review of phase 4: this route's errors are `kind: 'technical'` (a
       * `ConflictError`), so they **carry no `user_message`** — and the
       * `message` is English diagnostics. The admin was reading "Ride rid-… is
       * not flagged for fare review". It is the same defect that put
       * "body/code Code must contain only A-Z…" on a passenger's screen, and
       * the reason the error contract landed in this batch.
       */
      swal('Erro ao marcar', {
        text: mapApiError(error, 'Houve algum erro ao marcar a revisão...'),
        icon: 'error'
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Revisão de tarifas
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Corridas que o servidor marcou para confirmação humana: o{' '}
          <strong>desvio de distância</strong> no fecho da tarifa, a{' '}
          <strong>reserva de promoção que falhou</strong> na criação — em que o
          cliente viu um preço e pagou outro — e qualquer{' '}
          <strong>marca escrita pelo servidor</strong> (fecho forçado, fecho
          antecipado, tarifa cobrada pela distância estimada), cada uma
          explicada na linha da corrida.{' '}
          <strong>Marcar como revista não altera a tarifa</strong> — registra
          apenas quem reviu e quando.
        </p>
        <div className="flex flex-row flex-wrap gap-2">
          {REASON_FILTERS.map(f => {
            const active = reason === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setReason(f.key)}
                className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${
                  active
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-transparent text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {f.label}
                <span
                  className={`ml-2 text-xs ${active ? 'text-white/80' : 'text-gray-400'}`}
                >
                  {counts[f.key === 'all' ? 'all' : f.key]}
                </span>
              </button>
            )
          })}
        </div>

        <label className="flex flex-row items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={onlyPending}
            onChange={e => setOnlyPending(e.target.checked)}
            className="h-4 w-4"
          />
          Mostrar só as que ainda não foram revistas
        </label>
      </div>

      {isLoadingRides ? (
        <div className="w-full py-16 flex justify-center">
          <Spinner size={28} className="text-primary-200 animate-spin" />
        </div>
      ) : flagged.length === 0 ? (
        <div className="w-full p-10 rounded-md bg-light dark:bg-dark text-center text-sm text-gray-500 dark:text-gray-400">
          Nenhuma corrida à espera de revisão.
        </div>
      ) : (
        <div className="w-full flex flex-col gap-6">
          {flagged.map(ride => {
            /*
             * ⚠️ A distância pode faltar, e a linha aparece na mesma.
             *
             * Era `if (!distance) return null` — razoável quando o único
             * motivo era o desvio de distância. Com as reservas falhadas, uma
             * corrida pode estar aqui sem nada de errado na distância (ou com
             * uma tarifa V1, que não tem o bloco). Devolver `null` fazia o
             * filtro contar a corrida e não a mostrar: uma lista com um número
             * que não bate com as linhas.
             */
            const distance = fareDistance(ride)
            const signed = distance ? signedDeviationPercent(distance) : null
            const completedAt = formatDateTimeFromFirestore(ride.completed_at)
            const comparison = compareQuotedToCharged(ride)
            const reviewed = !!ride.fare_reviewed_by

            const porDistancia = distance?.review_required === true
            // A marca do `onRideCreated`, o recuo para as corridas de antes
            // dela, ou o que os números dizem (cotação com desconto, fecho
            // sem nenhum).
            const reservaFalhada =
              failedReservation(ride) || !!comparison?.discountNotApplied

            return (
              <div
                key={ride.id}
                className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-5"
              >
                {/* Cabeçalho: que corrida, e porque está aqui */}
                <div className="flex flex-row flex-wrap justify-between items-start gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                      {ride.id}
                    </span>
                    <span className="text-base font-semibold text-dark dark:text-light">
                      {ride.type ? RIDE_TYPE_LABELS[ride.type] : '—'}
                      {ride.vehicle_type
                        ? ` · ${VEHICLE_TYPE_LABELS[ride.vehicle_type]}`
                        : ''}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {ride.driver?.name ?? '— sem motorista —'} · concluída a{' '}
                      {completedAt.date} às {completedAt.time}
                    </span>
                  </div>

                  {reviewed ? (
                    <BadgeSimple label="Revista" color="green" />
                  ) : (
                    <BadgeSimple label="Por revisar" color="orange" />
                  )}
                </div>

                {/* O motivo da distância, traduzido, com o que procurar */}
                {porDistancia && distance && (
                  <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                    <div className="flex flex-row items-start gap-2">
                      <Info
                        size={16}
                        className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0"
                      />
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-dark dark:text-light">
                          {distance.reason
                            ? TRACK_UNRELIABLE_REASON_LABELS[distance.reason]
                            : `Desvio de distância acima do limite (${distance.deviation_percent} %)`}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {distance.reason
                            ? TRACK_UNRELIABLE_REASON_HINTS[distance.reason]
                            : 'A distância do percurso gravado afastou-se muito da estimada na cotação. Cobrou-se a real.'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* As marcas do servidor, com o nome cru quando a etiqueta
                    ainda não existe: uma marca nova aparece, não desaparece */}
                {(ride.review_flags ?? []).length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-row flex-wrap gap-2">
                      {(ride.review_flags ?? []).map(flag => (
                        <BadgeSimple
                          key={flag}
                          label={reviewFlagLabel(flag)}
                          color="orange"
                        />
                      ))}
                    </div>

                    {/*
                      O que cada marca quer dizer.

                      ⚠️ **A etiqueta sozinha não serve a quem revê.** "Cobrada
                      pela distância estimada" diz o quê e não diz o que fazer:
                      a tarifa está errada, ou está certa e só não foi medida?
                      São conversas diferentes com o passageiro, e essa
                      diferença vivia no HANDOFF — que o operador não lê.
                    */}
                    <ul className="flex flex-col gap-1.5 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                      {(ride.review_flags ?? []).map(flag => {
                        const explanation = reviewFlagExplanation(flag)
                        const isForcedClose = flag === FORCED_CLOSE_FLAG
                        const reason = isForcedClose
                          ? closeReasons[ride.id as string]
                          : undefined
                        return (
                          <li
                            key={`exp-${flag}`}
                            className="text-xs text-gray-600 dark:text-gray-300"
                          >
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                              {reviewFlagLabel(flag)}:
                            </span>{' '}
                            {explanation
                              ? stripMarkdown(explanation)
                              : 'Marca nova — ainda sem explicação escrita no painel.'}
                            {isForcedClose && (
                              <span className="mt-1 block">
                                <span className="font-medium text-gray-800 dark:text-gray-100">
                                  Motivo:
                                </span>{' '}
                                {reason === undefined
                                  ? 'a ler a auditoria…'
                                  : (reason ?? 'sem motivo registado na auditoria.')}
                              </span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {/* A promoção que não pegou — antes dos números, porque é
                    ela que os explica */}
                {reservaFalhada && (
                  <ReservationFailedNotice comparison={comparison} />
                )}

                {/* As distâncias, quando a tarifa as traz */}
                {distance && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Figure
                      label="Distância estimada"
                      value={`${distance.estimated_km.toFixed(1)} km`}
                      hint="da cotação"
                    />
                    <Figure
                      label="Distância real"
                      value={
                        distance.tracked_km === null
                          ? '— sem percurso —'
                          : `${distance.tracked_km.toFixed(1)} km`
                      }
                      hint={
                        signed === null
                          ? undefined
                          : `${signed > 0 ? '+' : ''}${signed} % face à estimada`
                      }
                      emphasis={signed !== null && Math.abs(signed) >= 40}
                    />
                  </div>
                )}

                {/* Os três números de cada lado */}
                {comparison && <FareBreakdown comparison={comparison} />}

                {distance && (
                  <div className="grid gap-2 sm:grid-cols-2 text-xs text-gray-600 dark:text-gray-300">
                    <span>
                      <strong>Cobrou-se:</strong>{' '}
                      {FARE_DISTANCE_SOURCE_LABELS[distance.source]} (
                      {distance.used_km.toFixed(1)} km)
                    </span>
                    {distance.end_reference && (
                      <span>
                        <strong>Fim medido contra:</strong>{' '}
                        {TRACK_END_REFERENCE_LABELS[distance.end_reference]}
                      </span>
                    )}
                  </div>
                )}

                {/* O percurso, com os descartados a outra cor */}
                <FareReviewMap ride={ride} />

                <div className="flex flex-row flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {reviewed ? (
                    <span className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <CheckCircle2 size={16} />
                      Revista por {ride.fare_reviewed_by}
                      {ride.fare_reviewed_at
                        ? ` a ${formatDateTimeFromFirestore(ride.fare_reviewed_at).date}`
                        : ''}
                    </span>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Marcar não altera a tarifa nem o que o motorista
                        recebeu.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMarkReviewed(ride)}
                        disabled={markFareReviewed.isPending}
                        className="flex items-center justify-center gap-2 px-5 py-2 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        Marcar como revista
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * O cotado contra o cobrado, nos três números.
 *
 * O ecrã comparava só os totais. Desde as functions 1.4.0 os dois são
 * depois do desconto e a comparação está certa — **excepto numa reserva
 * falhada**, em que a cotação mostrou desconto e o fecho não aplicou nenhum:
 * a diferença aparecia como desvio de tarifa sem o ser.
 *
 * O destaque está no **bruto**, que é o que o motor produziu e não se mexe
 * com a promoção ter pegado: é essa a linha que diz se a tarifa se desviou.
 */
function FareBreakdown({ comparison }: { comparison: FareComparison }) {
  const { quoted, charged, grossDelta, discountNotApplied } = comparison

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MoneyColumn
        title="Valor cotado"
        subtitle="estimativa mostrada ao passageiro"
        side={quoted}
      />
      <MoneyColumn
        title="Valor cobrado"
        subtitle="fechado pelo servidor"
        side={charged}
        // Um desvio no bruto é um desvio de tarifa. Um desconto que não pegou
        // não é, e tem o seu próprio aviso em cima.
        grossDelta={grossDelta}
        discountMissing={discountNotApplied}
      />
    </div>
  )
}

function MoneyColumn({
  title,
  subtitle,
  side,
  grossDelta,
  discountMissing
}: {
  title: string
  subtitle: string
  side: { gross: number; discount: number; total: number } | null
  grossDelta?: number | null
  discountMissing?: boolean
}) {
  if (!side) {
    return (
      <div className="flex flex-col gap-1 p-4 rounded-md bg-gray-50 dark:bg-gray-800">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <span className="text-lg font-bold text-dark dark:text-light">—</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          sem estimativa gravada
        </span>
      </div>
    )
  }

  const desvioBruto =
    grossDelta === null || grossDelta === undefined || grossDelta === 0
      ? null
      : `${grossDelta > 0 ? '+' : '−'}AOA ${formatMoney(Math.abs(grossDelta))}`

  return (
    <div className="flex flex-col gap-2 p-4 rounded-md bg-gray-50 dark:bg-gray-800">
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {subtitle}
        </span>
      </div>

      <dl className="flex flex-col gap-1 text-sm">
        <div className="flex flex-row justify-between">
          <dt className="text-gray-600 dark:text-gray-300">Bruto</dt>
          <dd
            className={`font-mono ${
              desvioBruto
                ? 'font-bold text-amber-600 dark:text-amber-400'
                : 'text-dark dark:text-light'
            }`}
          >
            AOA {formatMoney(side.gross)}
          </dd>
        </div>

        <div className="flex flex-row justify-between">
          <dt className="text-gray-600 dark:text-gray-300">Desconto</dt>
          <dd
            className={`font-mono ${
              discountMissing
                ? 'font-bold text-amber-600 dark:text-amber-400'
                : side.discount > 0
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {side.discount > 0 ? `−AOA ${formatMoney(side.discount)}` : '—'}
          </dd>
        </div>

        <div className="flex flex-row justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
          <dt className="font-semibold text-dark dark:text-light">Total</dt>
          <dd className="font-mono font-bold text-dark dark:text-light">
            AOA {formatMoney(side.total)}
          </dd>
        </div>
      </dl>

      {desvioBruto && (
        <span className="text-xs text-amber-700 dark:text-amber-400">
          {desvioBruto} no bruto face ao cotado
        </span>
      )}
    </div>
  )
}

/**
 * A reserva falhada, dita pelo nome.
 *
 * O desconto saiu entre cotar e criar a corrida: a promoção esgotou-se, o
 * `apply` não reservou, e a corrida nasceu com o preço cheio. O cliente viu
 * um número e pagou outro — e isto **não é um desvio de tarifa**, que era o
 * que o ecrã dizia antes.
 */
function ReservationFailedNotice({
  comparison
}: {
  comparison: FareComparison | null
}) {
  const perdido = comparison?.quoted?.discount ?? 0
  // `=== 0` e não `!grossDelta`: `null` é "não há cotação para comparar", e
  // isso não é o mesmo que "o bruto bate".
  const brutoBate = comparison?.grossDelta === 0

  return (
    <div className="p-4 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
      <div className="flex flex-row items-start gap-2">
        <TicketPercent
          size={16}
          className="mt-0.5 text-purple-600 dark:text-purple-400 shrink-0"
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-dark dark:text-light">
            A promoção não pegou — reserva falhada
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {perdido > 0 ? (
              <>
                A cotação mostrou <strong>AOA {formatMoney(perdido)}</strong> de
                desconto e o fecho não aplicou nenhum: o código esgotou-se
                entre a cotação e a criação da corrida.{' '}
              </>
            ) : (
              <>
                A corrida tem código promocional e não tem reserva
                (`promotion_id` sem `promotion_usage_id`).{' '}
              </>
            )}
            {brutoBate
              ? 'Não é um desvio de tarifa — o bruto bate com o cotado.'
              : 'Confirmar também o bruto: há diferença para além do desconto.'}{' '}
            O <code>onRideCreated</code> avisa isto nos logs.
          </span>
        </div>
      </div>
    </div>
  )
}

function Figure({
  label,
  value,
  hint,
  emphasis
}: {
  label: string
  value: string
  hint?: string
  emphasis?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-md bg-gray-50 dark:bg-gray-800">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-lg font-bold ${
          emphasis
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-dark dark:text-light'
        }`}
      >
        {value}
      </span>
      {hint && (
        <span className="text-xs text-gray-500 dark:text-gray-400">{hint}</span>
      )}
    </div>
  )
}
