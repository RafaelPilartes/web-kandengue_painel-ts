import { useState } from 'react'
import {
  AlertTriangle,
  Globe2,
  Info,
  ShieldCheck,
  ShieldOff
} from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { AppModal } from '@/components/modal/AppModal'
import { useRegionsSettingsViewModel } from '@/viewModels/RegionsSettingsViewModel'
import { showToast } from '@/utils/toasts'

/**
 * The region check's switch — the brake described in the handoff of
 * 2026-10-24.
 *
 * ⚠️ **It is a brake, not a feature flag.** On is the normal state and the
 * default: an absent document means on, and so does a failed read. Off exists
 * for one situation — the check refusing rides it should not — and it stops
 * the refusals within the API's 5-minute cache, with no deploy.
 */
export function RegionsSettings() {
  const { settings, enabled, exists, isLoading, setEnabled, isSubmitting } =
    useRegionsSettingsViewModel()

  // Turning it **off** asks; turning it back on does not. Only one of the two
  // directions lets rides through unchecked.
  const [confirmDisable, setConfirmDisable] = useState(false)

  const apply = async (next: boolean) => {
    try {
      await setEnabled(next)
      showToast(
        'success',
        next
          ? 'Verificação de região ligada'
          : 'Verificação de região desligada — as recusas param em até 5 minutos'
      )
    } catch (err) {
      showToast('error', (err as Error).message || 'Não foi possível gravar')
    }
  }

  const handleToggle = (next: boolean) => {
    if (!next) {
      setConfirmDisable(true)
      return
    }
    void apply(true)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Verificação de região
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Decide se a Kandengue recusa corridas fora das províncias onde opera.
        </p>
      </div>

      {/* The sentence that explains what the switch does */}
      <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 flex flex-row items-start gap-2">
        <Info
          size={16}
          className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0"
          aria-hidden
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-dark dark:text-light">
            O que este interruptor faz
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            <strong>Ligado</strong> (o normal): antes de cotar e antes de criar
            uma corrida, o servidor descobre a província da recolha e recusa se
            ali não houver nenhum serviço activo — o passageiro lê{' '}
            <em>"A Kandengue ainda não opera nesta zona."</em> Recusa também
            quando o destino fica fora da área de operação da recolha, com{' '}
            <em>"Para já só fazemos corridas dentro da mesma província."</em>
            <br />
            <strong>Desligado</strong>: nenhuma corrida é recusada por causa da
            região, em qualquer província do país. Os preços continuam a vir da
            província que o servidor conseguir resolver.
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size={24} className="animate-spin text-primary-200" />
          </div>
        ) : (
          <>
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="flex flex-row items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    enabled
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {enabled ? (
                    <ShieldCheck size={20} aria-hidden />
                  ) : (
                    <ShieldOff size={20} aria-hidden />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {enabled
                      ? 'Ligada — as corridas fora das províncias servidas são recusadas'
                      : 'Desligada — nenhuma corrida é recusada por causa da região'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Uma alteração chega ao servidor em{' '}
                    <strong>até 5 minutos</strong> (a cache da tabela das
                    províncias), sem deploy e sem reiniciar nada.
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label="Verificação de região"
                disabled={isSubmitting}
                onClick={() => handleToggle(!enabled)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                  enabled ? 'bg-green-600' : 'bg-red-500 dark:bg-red-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!enabled && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex flex-row items-start gap-2">
                <AlertTriangle
                  size={15}
                  className="mt-0.5 text-red-600 dark:text-red-400 shrink-0"
                  aria-hidden
                />
                <span className="text-xs text-red-800 dark:text-red-300">
                  Enquanto estiver desligada, um passageiro em qualquer
                  província do país pode pedir uma corrida — mesmo onde não há
                  motoristas. Volta a ligá-la assim que o problema estiver
                  resolvido.
                </span>
              </div>
            )}

            {/*
             * "Never written" and "somebody turned it on" are different facts,
             * and the screen says which. Without it, a document that never
             * existed looks like a decision somebody took.
             */}
            {!exists ? (
              <p className="text-xs text-gray-400 flex flex-row items-center gap-1.5">
                <Globe2 size={13} aria-hidden />
                O documento{' '}
                <span className="font-mono">app_config/regions</span> ainda não
                foi escrito — e um documento ausente vale{' '}
                <strong>ligado</strong>.
              </p>
            ) : (
              settings?.updated_at && (
                <p className="text-xs text-gray-400">
                  Última alteração:{' '}
                  {settings.updated_at.toLocaleString('pt-PT')}
                  {settings.updated_by ? ' por ' : ''}
                  {settings.updated_by && (
                    <span className="font-mono">{settings.updated_by}</span>
                  )}
                </p>
              )
            )}
          </>
        )}
      </div>

      <AppModal
        isOpen={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        title="Desligar a verificação de região?"
        size="md"
        variant="center"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDisable(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setConfirmDisable(false)
                void apply(false)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? (
                <Spinner size={16} className="animate-spin" />
              ) : (
                <ShieldOff size={16} aria-hidden />
              )}
              Sim, desligar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-200">
          <p>
            A partir de <strong>até 5 minutos</strong> depois de gravar, nenhuma
            corrida é recusada por causa da província — em{' '}
            <strong>todo o país</strong>, e não só onde houver um problema.
          </p>
          <p>
            Isto existe para uma situação: a verificação está a recusar corridas
            que devia aceitar. Não é a forma de abrir uma província nova — para
            isso activa-se o perfil de preço dessa província em{' '}
            <strong>Preços → Perfis</strong>.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            A alteração fica registada com o teu nome na auditoria.
          </p>
        </div>
      </AppModal>
    </div>
  )
}
