import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { usePricingRulesViewModel } from '@/viewModels/PricingViewModel'
import { showToast } from '@/utils/toasts'
import {
  RIDE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import type { PricingRuleInterface } from '@rafaelpilartes/kandengue-shared/interfaces'
import { WEATHER_LABELS, DAY_LABELS } from './ruleLabels'

// Regras de acréscimo: condicionais (hora, dia, clima), com âmbito por
// região, tipo de corrida e veículo. Sem veículo aplicam-se a motas e
// carros; uma regra só para motas preenche o campo.

function scopeSummary(rule: PricingRuleInterface): string {
  const parts: string[] = []
  if (rule.scope.regions?.length) parts.push(rule.scope.regions.join(', '))
  if (rule.scope.ride_types?.length)
    parts.push(rule.scope.ride_types.map(t => RIDE_TYPE_LABELS[t]).join(', '))
  if (rule.scope.vehicle_types?.length)
    parts.push(rule.scope.vehicle_types.map(v => VEHICLE_TYPE_LABELS[v]).join(', '))
  return parts.length ? parts.join(' · ') : 'Tudo'
}

function conditionsSummary(rule: PricingRuleInterface): string {
  const parts: string[] = []
  if (rule.conditions.weather?.length)
    parts.push(rule.conditions.weather.map(w => WEATHER_LABELS[w]).join('/'))
  if (rule.conditions.days_of_week?.length)
    parts.push(rule.conditions.days_of_week.map(d => DAY_LABELS[d]).join(', '))
  if (rule.conditions.time_windows?.length)
    parts.push(rule.conditions.time_windows.map(w => `${w.start_time}–${w.end_time}`).join(', '))
  return parts.join(' · ')
}

function effectSummary(rule: PricingRuleInterface): string {
  const value = rule.effect.kind === 'percent' ? `+${rule.effect.value}%` : `+${rule.effect.value} Kz`
  const share =
    rule.surcharge_driver_share === null
      ? 'repartição normal'
      : `${rule.surcharge_driver_share}% ao motorista`
  return `${value} · ${share}`
}

export function PricingRulesPage() {
  const { rules, loading, error, deleteRule } = usePricingRulesViewModel()
  const [deleting, setDeleting] = useState<string | null>(null)

  const sorted = useMemo(
    () =>
      [...rules].sort(
        (a, b) => a.stack_group.localeCompare(b.stack_group) || b.priority - a.priority
      ),
    [rules]
  )

  const handleDelete = async (rule: PricingRuleInterface) => {
    // `window.confirm` bloqueia a automação do browser; a confirmação é um
    // segundo clique no mesmo botão.
    if (deleting !== rule.id) {
      setDeleting(rule.id)
      showToast('info', `Carrega outra vez para apagar "${rule.name}"`)
      return
    }
    try {
      await deleteRule.mutateAsync(rule)
      showToast('success', `Regra "${rule.name}" apagada`)
    } catch (err) {
      showToast('error', (err as Error).message || 'Não foi possível apagar a regra')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Preços' },
              { label: 'Perfis de preço', to: routsNameMain.pricing.profiles },
              { label: 'Regras de acréscimo' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            Regras de acréscimo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Regras do mesmo grupo não se somam: aplica-se a de maior prioridade.
            Grupos diferentes somam-se, até ao tecto do perfil.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={routsNameMain.pricing.profiles}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            <ArrowLeft size={16} /> Perfis
          </Link>
          <Link
            to={routsNameMain.pricing.ruleCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-200 text-white text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} /> Nova regra
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          Não foi possível carregar as regras: {(error as Error).message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} className="animate-spin text-primary-200" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3">Regra</th>
                <th className="px-4 py-3">Grupo / prioridade</th>
                <th className="px-4 py-3">Âmbito</th>
                <th className="px-4 py-3">Condições</th>
                <th className="px-4 py-3">Acréscimo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Sem regras. Sem regras, o preço é só o do perfil.
                  </td>
                </tr>
              )}
              {sorted.map(rule => (
                <tr
                  key={rule.id}
                  className="border-b border-gray-50 dark:border-gray-700/60 last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white">{rule.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{rule.id} · v{rule.version}</div>
                  </td>
                  <td className="px-4 py-3">
                    {rule.stack_group} · {rule.priority}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{scopeSummary(rule)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{conditionsSummary(rule)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{effectSummary(rule)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        rule.active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {rule.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`${routsNameMain.pricing.ruleEditStr}${rule.id}`}
                        aria-label={`Editar ${rule.name}`}
                        className="p-2 text-gray-500 hover:text-primary-200"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Apagar ${rule.name}`}
                        onClick={() => handleDelete(rule)}
                        className={`p-2 ${deleting === rule.id ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
