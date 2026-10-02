import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Smartphone } from 'lucide-react'
import swal from 'sweetalert'
import {
  APP_VERSION_MIN_RULE,
  APP_VERSION_TARGET_LABELS,
  APP_VERSION_TARGETS
} from '@rafaelpilartes/kandengue-shared/constants'
import type { AppVersionTarget } from '@rafaelpilartes/kandengue-shared/constants'
import { useAppConfigViewModel } from '@/viewModels/AppConfigViewModel'
import type { AppVersionsPayload } from '@/core/interfaces/IAdminConfigRepository'
import { formatDateTimeFromFirestore } from '@/utils/date'

type Campo = keyof AppVersionsPayload

const vazio: AppVersionsPayload = {
  min_version_driver_android: '',
  min_version_driver_ios: '',
  latest_version_driver_android: '',
  latest_version_driver_ios: '',
  min_version_passenger_android: '',
  min_version_passenger_ios: '',
  latest_version_passenger_android: '',
  latest_version_passenger_ios: ''
}

/** Compara `x.y.z` por número. `'1.10.0' > '1.9.0'`, que em texto não é. */
function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v.split('-')[0].split('.').map(p => Number.parseInt(p, 10) || 0)
  const [l, r] = [parse(a), parse(b)]
  for (let i = 0; i < 3; i++) {
    const d = (l[i] ?? 0) - (r[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  return 0
}

const ehSemver = (v: string) => /^\d+\.\d+\.\d+$/.test(v)

/**
 * O portão de versão das apps, por app e por plataforma.
 *
 * A regra do campo `nota` do documento está no ecrã, não escondida numa
 * consola: subir um mínimo antes de a loja aprovar essa versão deixa toda a
 * base instalada dessa plataforma sem saída, porque o botão leva a uma loja
 * que ainda não tem a versão. São quatro campos e não dois porque a Apple e
 * a Google aprovam em dias diferentes.
 */
export function AppVersionsSettings() {
  const { appVersions, isLoadingAppVersions, saveAppVersions } =
    useAppConfigViewModel()

  const [form, setForm] = useState<AppVersionsPayload>(vazio)

  useEffect(() => {
    if (!appVersions) return
    setForm({
      min_version_driver_android: appVersions.min_version_driver_android ?? '',
      min_version_driver_ios: appVersions.min_version_driver_ios ?? '',
      latest_version_driver_android:
        appVersions.latest_version_driver_android ?? '',
      latest_version_driver_ios: appVersions.latest_version_driver_ios ?? '',
      min_version_passenger_android:
        appVersions.min_version_passenger_android ?? '',
      min_version_passenger_ios: appVersions.min_version_passenger_ios ?? '',
      latest_version_passenger_android:
        appVersions.latest_version_passenger_android ?? '',
      latest_version_passenger_ios:
        appVersions.latest_version_passenger_ios ?? ''
    })
  }, [appVersions])

  // Que mínimos é que esta gravação SOBE. É a lista que a confirmação mostra.
  const minimosQueSobem = useMemo(() => {
    if (!appVersions) return []
    return APP_VERSION_TARGETS.filter(target => {
      const campo = `min_version_${target}` as Campo
      const antes = appVersions[campo] ?? ''
      const agora = form[campo]
      return (
        ehSemver(agora) && ehSemver(antes) && compareVersions(agora, antes) > 0
      )
    })
  }, [appVersions, form])

  const erros = useMemo(() => {
    const lista: string[] = []
    for (const [campo, valor] of Object.entries(form)) {
      if (!ehSemver(valor)) lista.push(`${campo} não é x.y.z`)
    }
    for (const target of APP_VERSION_TARGETS) {
      const min = form[`min_version_${target}` as Campo]
      const latest = form[`latest_version_${target}` as Campo]
      if (
        ehSemver(min) &&
        ehSemver(latest) &&
        compareVersions(min, latest) > 0
      ) {
        lista.push(
          `${APP_VERSION_TARGET_LABELS[target]}: o mínimo (${min}) está acima da versão mais recente (${latest})`
        )
      }
    }
    return lista
  }, [form])

  const alterado = useMemo(() => {
    if (!appVersions) return false
    return (Object.keys(form) as Campo[]).some(
      k => (appVersions[k] ?? '') !== form[k]
    )
  }, [appVersions, form])

  async function handleSave() {
    if (erros.length > 0) return

    // Subir um mínimo bloqueia gente. Pedir confirmação a dizer quem é que
    // fica bloqueado é o mínimo antes de uma escrita destas.
    if (minimosQueSobem.length > 0) {
      const lista = minimosQueSobem
        .map(t => `• ${APP_VERSION_TARGET_LABELS[t]} → ${form[`min_version_${t}` as Campo]}`)
        .join('\n')
      const confirma = await swal({
        title: 'Isto vai bloquear apps',
        text:
          `Vais subir o mínimo de:\n${lista}\n\n` +
          'Quem tiver uma versão inferior fica bloqueado no arranque, com um ' +
          'botão para a loja. Confirma que a loja já aprovou essas versões.',
        buttons: ['Cancelar', 'Já aprovaram, subir'],
        icon: 'warning',
        dangerMode: true
      })
      if (!confirma) return
    }

    try {
      const result = await saveAppVersions.mutateAsync(form)
      swal(
        result.changed
          ? `Gravado: ${result.changed_fields.length} campo(s)`
          : 'Nada mudou',
        { icon: result.changed ? 'success' : 'info' }
      )
    } catch (error) {
      swal('Erro ao gravar', {
        text:
          error instanceof Error
            ? error.message
            : 'Houve algum erro ao gravar as versões...',
        icon: 'error'
      })
    }
  }

  if (isLoadingAppVersions) {
    return <div className="text-sm text-gray-500">A carregar…</div>
  }

  const actualizado = appVersions?.updated_at
    ? formatDateTimeFromFirestore(appVersions.updated_at)
    : null

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Versões das apps
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        O portão que as apps lêem no arranque, por app e por plataforma.
      </p>

      {/* A regra, no ecrã. É a mesma frase que vive no campo `nota` do
          documento, para quem o abre na consola. */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0"
          />
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {APP_VERSION_MIN_RULE}
          </p>
        </div>
      </div>

      {actualizado && (
        <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
          Última alteração a {actualizado.date} às {actualizado.time}
          {appVersions?.updated_by ? ` por ${appVersions.updated_by}` : ''}
        </p>
      )}

      <div className="space-y-4">
        {APP_VERSION_TARGETS.map(target => (
          <Linha
            key={target}
            target={target}
            min={form[`min_version_${target}` as Campo]}
            latest={form[`latest_version_${target}` as Campo]}
            sobeOMinimo={minimosQueSobem.includes(target)}
            onChange={(campo, valor) =>
              setForm(prev => ({ ...prev, [campo]: valor }))
            }
          />
        ))}
      </div>

      {erros.length > 0 && (
        <ul className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
          {erros.map(e => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!alterado || erros.length > 0 || saveAppVersions.isPending}
          className="px-6 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-medium text-sm disabled:opacity-40"
        >
          {saveAppVersions.isPending ? 'A gravar…' : 'Gravar versões'}
        </button>
        {alterado && erros.length === 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {minimosQueSobem.length > 0
              ? `${minimosQueSobem.length} mínimo(s) a subir — vai pedir confirmação`
              : 'Nenhum mínimo sobe nesta gravação'}
          </span>
        )}
      </div>
    </div>
  )
}

function Linha({
  target,
  min,
  latest,
  sobeOMinimo,
  onChange
}: {
  target: AppVersionTarget
  min: string
  latest: string
  sobeOMinimo: boolean
  onChange: (campo: Campo, valor: string) => void
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
        <Smartphone size={16} className="text-gray-400" />
        {APP_VERSION_TARGET_LABELS[target]}
        {sobeOMinimo && (
          <span className="ml-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold">
            MÍNIMO A SUBIR
          </span>
        )}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Mínimo exigido — <strong>bloqueia</strong> abaixo
          </span>
          <input
            value={min}
            onChange={e =>
              onChange(`min_version_${target}` as Campo, e.target.value)
            }
            placeholder="1.2.0"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Mais recente — só convida
          </span>
          <input
            value={latest}
            onChange={e =>
              onChange(`latest_version_${target}` as Campo, e.target.value)
            }
            placeholder="1.2.0"
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
      </div>
    </div>
  )
}
