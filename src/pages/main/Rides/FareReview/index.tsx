import { useMemo, useState } from 'react'
import { Spinner } from 'phosphor-react'
import swal from 'sweetalert'
import { CheckCircle2, Info } from 'lucide-react'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BadgeSimple } from '@/components/badge/BadgeSimple'
import { FareReviewMap } from './FareReviewMap'

import { useRidesViewModel } from '@/viewModels/RideViewModel'
import type { RideEntity } from '@/core/entities/Ride'
import { fareDistance, signedDeviationPercent } from '@/helpers/fareReview'
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
export function FareReviewPage() {
  const [onlyPending, setOnlyPending] = useState(true)

  // O Firestore não indexa `fare.distance.review_required` hoje, e criar o
  // índice composto é um deploy à parte. Filtra-se em memória sobre as
  // corridas concluídas — são dezenas, não milhares, e é o mesmo que o
  // `expireStalePresence` faz pela mesma razão.
  const { rides, isLoadingRides, markFareReviewed } = useRidesViewModel(
    500,
    0,
    undefined,
    { status: 'completed' } as Partial<RideEntity>
  )

  const flagged = useMemo(() => {
    const withReview = rides.filter(ride => {
      const distance = fareDistance(ride)
      return distance?.review_required === true
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
      swal('Erro ao marcar', {
        text:
          error instanceof Error
            ? error.message
            : 'Houve algum erro ao marcar a revisão...',
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
          Corridas em que o servidor marcou o fecho da tarifa para
          confirmação. <strong>Marcar como revista não altera a tarifa</strong>
          {' '}— registra apenas quem reviu e quando.
        </p>
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
            const distance = fareDistance(ride)
            if (!distance) return null

            const signed = signedDeviationPercent(distance)
            const completedAt = formatDateTimeFromFirestore(ride.completed_at)
            const quoted = ride.estimated_fare?.total ?? null
            const charged = ride.fare?.total ?? 0
            const reviewed = !!ride.fare_reviewed_by

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

                {/* O motivo, traduzido, com o que procurar */}
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

                {/* Os números: estimada vs real, cotado vs cobrado */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <Figure
                    label="Valor cotado"
                    value={quoted === null ? '—' : `AOA ${formatMoney(quoted)}`}
                    hint="estimativa mostrada ao passageiro"
                  />
                  <Figure
                    label="Valor cobrado"
                    value={`AOA ${formatMoney(charged)}`}
                    hint={
                      quoted === null
                        ? undefined
                        : `${charged > quoted ? '+' : ''}AOA ${formatMoney(charged - quoted)}`
                    }
                    emphasis={quoted !== null && charged !== quoted}
                  />
                </div>

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
