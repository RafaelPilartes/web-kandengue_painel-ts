import { useMemo, useState } from 'react'
import { Spinner } from 'phosphor-react'
import swal from 'sweetalert'
import { Check, ExternalLink, X as XIcon } from 'lucide-react'

// Components
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { BadgeSimple } from '@/components/badge/BadgeSimple'

// Dados
import { useVehiclesViewModel } from '@/viewModels/VehicleViewModel'
import { useDriversByIds } from '@/hooks/useDriversByIds'
import { useDocumentsByVehicleIds } from '@/hooks/useDocumentsByVehicleIds'
import type { VehicleEntity } from '@/core/entities/Vehicle'
import type { VehicleStatusEnumType } from '@/types/enum'
import {
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getVehicleStatusLabel
} from '@/utils/gettersLabels'
import { VEHICLE_TYPE_LABELS } from '@rafaelpilartes/kandengue-shared/constants'
import { formatDateTimeFromFirestore } from '@/utils/date'

/**
 * A fila de viaturas por validar.
 *
 * Existia só como duas entradas de menu no detalhe de um motorista, o que
 * obrigava a saber de antemão quem tinha submetido o quê. E validar escrevia
 * `status` directamente no Firestore, sem motivo e sem registo — agora é a
 * API (`POST /api/v1/admin/vehicles/:id/review`), e as regras negam `status`
 * ao cliente, admin incluído.
 */
export function VehiclesPage() {
  // A fila é a das viaturas por decidir; ver as outras é um clique.
  const [status, setStatus] = useState<VehicleStatusEnumType | undefined>(
    'under_analysis'
  )

  const { vehicles, loading, reviewVehicle } = useVehiclesViewModel(
    200,
    undefined,
    status ? ({ status } as Partial<VehicleEntity>) : undefined
  )

  // As viaturas mais antigas primeiro: uma fila serve-se pela ordem de
  // chegada, e quem está à espera há três dias não fica no fim da lista.
  const queue = useMemo(
    () =>
      [...vehicles].sort(
        (a, b) =>
          (a.created_at?.getTime() ?? 0) - (b.created_at?.getTime() ?? 0)
      ),
    [vehicles]
  )

  const { driversById } = useDriversByIds(queue.map(v => v.user_id))
  const { documentsByVehicleId } = useDocumentsByVehicleIds(queue.map(v => v.id))

  const itemsBreadcrumbs = [
    { label: 'Início', to: '/' },
    { label: 'Validação de Viaturas' }
  ]

  async function handleValidate(vehicle: VehicleEntity) {
    const willValidate = await swal({
      title: `Validar a viatura ${vehicle.plate}?`,
      text: 'A partir daí o motorista passa a poder receber corridas com ela.',
      buttons: ['Cancelar', 'Validar'],
      icon: 'warning'
    })

    if (!willValidate) return

    try {
      const result = await reviewVehicle.mutateAsync({
        id: vehicle.id,
        decision: 'validated'
      })

      swal(
        result.changed
          ? 'Viatura validada'
          : 'Esta viatura já estava validada',
        { icon: result.changed ? 'success' : 'info' }
      )
    } catch (error) {
      swal('Erro ao validar', {
        text:
          error instanceof Error
            ? error.message
            : 'Houve algum erro durante a validação...',
        icon: 'error'
      })
    }
  }

  async function handleReject(vehicle: VehicleEntity) {
    const willReject = await swal({
      title: `Recusar a viatura ${vehicle.plate}?`,
      text: 'O motivo fica visível ao motorista na app.',
      content: {
        element: 'textarea',
        attributes: {
          placeholder: 'Motivo da recusa — o que o motorista tem de corrigir',
          rows: 4,
          id: 'vehicle-rejection-reason'
        }
      },
      buttons: ['Cancelar', 'Recusar'],
      icon: 'warning',
      dangerMode: true
    })

    if (!willReject) return

    const textarea = document.getElementById(
      'vehicle-rejection-reason'
    ) as HTMLTextAreaElement | null
    const reason = textarea?.value.trim()

    if (!reason) {
      swal('Erro!', 'Por favor, informe o motivo da recusa.', 'error')
      return
    }

    try {
      const result = await reviewVehicle.mutateAsync({
        id: vehicle.id,
        decision: 'rejected',
        reason
      })

      swal(
        result.changed ? 'Viatura recusada' : 'Esta viatura já estava recusada',
        { icon: result.changed ? 'success' : 'info' }
      )
    } catch (error) {
      swal('Erro ao recusar', {
        text:
          error instanceof Error
            ? error.message
            : 'Houve algum erro durante a recusa...',
        icon: 'error'
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Validação de Viaturas
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
      </div>

      <div className="w-full grid gap-6 md:grid-cols-5">
        <SelectSearchableCustom
          name="status"
          label="Estado"
          defaultValue="under_analysis"
          options={[
            { value: '', label: 'Todos' },
            { value: 'under_analysis', label: 'Em análise' },
            { value: 'validated', label: 'Validado' },
            { value: 'rejected', label: 'Rejeitado' }
          ]}
          onOptionChange={e =>
            setStatus((e || undefined) as VehicleStatusEnumType | undefined)
          }
        />
      </div>

      {loading ? (
        <div className="w-full py-16 flex justify-center">
          <Spinner size={28} className="text-primary-200 animate-spin" />
        </div>
      ) : queue.length === 0 ? (
        <div className="w-full p-10 rounded-md bg-light dark:bg-dark text-center text-sm text-gray-500 dark:text-gray-400">
          Nenhuma viatura nesta fila.
        </div>
      ) : (
        <div className="w-full grid gap-6 lg:grid-cols-2">
          {queue.map(vehicle => {
            const driver = driversById.get(vehicle.user_id)
            const documents = documentsByVehicleId.get(vehicle.id) ?? []
            const submittedAt = formatDateTimeFromFirestore(vehicle.created_at)
            const isUnderAnalysis = vehicle.status === 'under_analysis'
            const isRejected = vehicle.status === 'rejected'

            return (
              <div
                key={vehicle.id}
                className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-4"
              >
                <div className="flex flex-row justify-between items-start gap-4">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-dark dark:text-light">
                      {vehicle.plate || '— sem matrícula —'}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {VEHICLE_TYPE_LABELS[vehicle.type]} ·{' '}
                      {[vehicle.brand, vehicle.model, vehicle.color]
                        .filter(Boolean)
                        .join(' · ') || 'sem descritivo'}
                    </span>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {driver?.name ?? '— motorista não encontrado —'}
                      {driver?.phone ? ` · ${driver.phone}` : ''}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Submetida a {submittedAt.date} às {submittedAt.time}
                    </span>
                  </div>
                  <BadgeSimple
                    label={getVehicleStatusLabel(vehicle.status)}
                    color={
                      vehicle.status === 'validated'
                        ? 'green'
                        : isUnderAnalysis
                        ? 'yellow'
                        : 'red'
                    }
                  />
                </div>

                {/* Fotos: a da viatura, e as dos documentos que lhe pertencem */}
                <div className="flex flex-row flex-wrap gap-3">
                  {vehicle.image && (
                    <a
                      href={vehicle.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Foto da viatura"
                      className="flex flex-col items-center gap-1"
                    >
                      <img
                        src={vehicle.image}
                        alt="Foto da viatura"
                        loading="lazy"
                        className="h-24 w-32 rounded object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Viatura
                      </span>
                    </a>
                  )}

                  {documents.map(document => (
                    <a
                      key={document.id}
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${getDocumentTypeLabel(document.type)} — ${getDocumentStatusLabel(document.status)}`}
                      className="flex flex-col items-center gap-1"
                    >
                      <img
                        src={document.url}
                        alt={getDocumentTypeLabel(document.type)}
                        loading="lazy"
                        className="h-24 w-32 rounded object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        {getDocumentTypeLabel(document.type)}
                        <ExternalLink size={12} />
                      </span>
                    </a>
                  ))}

                  {!vehicle.image && documents.length === 0 && (
                    <span className="text-xs text-gray-400">
                      Sem foto nem documentos submetidos
                    </span>
                  )}
                </div>

                {isRejected && vehicle.rejection_reason && (
                  <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Motivo da recusa — é isto que o motorista vê na app
                    </p>
                    <p className="text-sm text-dark dark:text-light">
                      {vehicle.rejection_reason}
                    </p>
                  </div>
                )}

                {/* Uma viatura validada não se retira por aqui: isso tira o
                    motorista do dispatch e a API recusa-o. Uma recusada
                    pode ser corrigida. */}
                {vehicle.status !== 'validated' && (
                  <div className="flex flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleValidate(vehicle)}
                      disabled={reviewVehicle.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check size={16} />
                      Validar
                    </button>
                    {isUnderAnalysis && (
                      <button
                        type="button"
                        onClick={() => handleReject(vehicle)}
                        disabled={reviewVehicle.isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md border border-red-500 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                      >
                        <XIcon size={16} />
                        Recusar
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
