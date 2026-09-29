import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { usePricingRulesViewModel } from '@/viewModels/PricingViewModel'
import type { PricingRuleInput } from '@/core/interfaces/IPricingRepository'
import { showToast } from '@/utils/toasts'
import {
  RIDE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import {
  RIDE_TYPES,
  VEHICLE_TYPES,
  type RideType,
  type VehicleType
} from '@rafaelpilartes/kandengue-shared/enums'
import { validatePricingRule } from '@rafaelpilartes/kandengue-shared/functions'
import type {
  PricingRuleInterface,
  TimeWindowInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import type { DayOfWeek, SurchargeKind, WeatherCondition } from '@rafaelpilartes/kandengue-shared/types'
import { ALL_DAYS, ALL_WEATHER, DAY_LABELS, WEATHER_LABELS } from './ruleLabels'

// Uma regra sem condições é recusada pela lib: um acréscimo permanente é
// preço base e pertence ao perfil. O filtro de veículo é opcional — vazio
// aplica-se a motas e carros.

const inputClasses =
  'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm'

type FormState = {
  id: string
  name: string
  description: string
  regions: string
  ride_types: RideType[]
  vehicle_types: VehicleType[]
  days_of_week: DayOfWeek[]
  time_windows: TimeWindowInterface[]
  weather: WeatherCondition[]
  kind: SurchargeKind
  value: number
  surcharge_driver_share: string
  stack_group: string
  priority: number
  valid_from: string
  valid_until: string
  active: boolean
  note: string
}

const emptyState: FormState = {
  id: '',
  name: '',
  description: '',
  regions: '',
  ride_types: [],
  vehicle_types: [],
  days_of_week: [],
  time_windows: [],
  weather: [],
  kind: 'percent',
  value: 20,
  surcharge_driver_share: '',
  stack_group: 'weather',
  priority: 0,
  valid_from: '',
  valid_until: '',
  active: true,
  note: ''
}

const toDateInput = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '')

function ruleToForm(rule: PricingRuleInterface): FormState {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description ?? '',
    regions: (rule.scope.regions ?? []).join(', '),
    ride_types: rule.scope.ride_types ?? [],
    vehicle_types: rule.scope.vehicle_types ?? [],
    days_of_week: rule.conditions.days_of_week ?? [],
    time_windows: rule.conditions.time_windows ?? [],
    weather: rule.conditions.weather ?? [],
    kind: rule.effect.kind,
    value: rule.effect.value,
    surcharge_driver_share: rule.surcharge_driver_share === null ? '' : String(rule.surcharge_driver_share),
    stack_group: rule.stack_group,
    priority: rule.priority,
    valid_from: toDateInput(rule.valid_from),
    valid_until: toDateInput(rule.valid_until),
    active: rule.active,
    note: ''
  }
}

function formToInput(form: FormState): PricingRuleInput {
  const regions = form.regions.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)
  return {
    id: form.id || undefined,
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    scope: {
      regions: regions.length ? regions : undefined,
      ride_types: form.ride_types.length ? form.ride_types : undefined,
      vehicle_types: form.vehicle_types.length ? form.vehicle_types : undefined
    },
    conditions: {
      days_of_week: form.days_of_week.length ? form.days_of_week : undefined,
      time_windows: form.time_windows.length ? form.time_windows : undefined,
      weather: form.weather.length ? form.weather : undefined
    },
    effect: { kind: form.kind, value: Number(form.value) },
    surcharge_driver_share: form.surcharge_driver_share === '' ? null : Number(form.surcharge_driver_share),
    stack_group: form.stack_group.trim(),
    priority: Number(form.priority),
    valid_from: form.valid_from ? new Date(form.valid_from) : undefined,
    valid_until: form.valid_until ? new Date(form.valid_until) : undefined,
    active: form.active,
    note: form.note.trim() || undefined
  }
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter(v => v !== value) : [...list, value]
}

function Chips<T extends string | number>({
  options,
  selected,
  label,
  onToggle
}: {
  options: readonly T[]
  selected: T[]
  label: (value: T) => string
  onToggle: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const checked = selected.includes(option)
        return (
          <button
            key={String(option)}
            type="button"
            onClick={() => onToggle(option)}
            className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
              checked
                ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {label(option)}
          </button>
        )
      })}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
      {children}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  )
}

export function PricingRuleFormPage() {
  const navigate = useNavigate()
  const { ruleId } = useParams<{ ruleId: string }>()
  const isEdit = !!ruleId

  const { rules, loading, saveRule } = usePricingRulesViewModel()
  const [form, setForm] = useState<FormState>(emptyState)
  const [submitting, setSubmitting] = useState(false)

  const existing = useMemo(
    () => (isEdit ? rules.find(r => r.id === ruleId) ?? null : null),
    [isEdit, rules, ruleId]
  )
  useEffect(() => {
    if (existing) setForm(ruleToForm(existing))
  }, [existing])

  const errors = useMemo(() => {
    const { note, id, ...fields } = formToInput(form)
    void note // a nota é da auditoria, não da regra
    return validatePricingRule({ ...fields, id: id ?? 'nova', version: 0 })
  }, [form])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.length > 0) {
      showToast('error', 'A regra tem erros. Corrige-os antes de gravar.')
      return
    }
    setSubmitting(true)
    try {
      const saved = await saveRule.mutateAsync(formToInput(form))
      showToast('success', `Regra "${saved.name}" gravada (v${saved.version})`)
      navigate(routsNameMain.pricing.rules)
    } catch (err) {
      showToast('error', (err as Error).message || 'Não foi possível gravar a regra')
    } finally {
      setSubmitting(false)
    }
  }

  if (isEdit && loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={28} className="animate-spin text-primary-200" />
      </div>
    )
  }
  if (isEdit && !loading && !existing) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-gray-600">Regra {ruleId} não encontrada.</p>
        <Link to={routsNameMain.pricing.rules} className="text-primary-200 hover:underline">
          Voltar às regras
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Preços' },
              { label: 'Regras de acréscimo', to: routsNameMain.pricing.rules },
              { label: isEdit ? 'Editar' : 'Nova' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isEdit ? `Editar "${existing?.name}"` : 'Nova regra de acréscimo'}
          </h1>
        </div>
        <Link to={routsNameMain.pricing.rules} className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Nome">
          <input className={inputClasses} value={form.name} onChange={e => update('name', e.target.value)} maxLength={80} required />
        </Field>
        <Field label="Grupo" hint="Regras do mesmo grupo não se somam (ex.: weather, peak)">
          <input className={inputClasses} value={form.stack_group} onChange={e => update('stack_group', e.target.value)} maxLength={40} required />
        </Field>
        <Field label="Prioridade" hint="No mesmo grupo ganha a maior">
          <input className={inputClasses} type="number" value={form.priority} onChange={e => update('priority', Number(e.target.value))} />
        </Field>
        <Field label="Descrição">
          <input className={inputClasses} value={form.description} onChange={e => update('description', e.target.value)} maxLength={300} />
        </Field>
        <Field label="Estado">
          <label className="inline-flex items-center gap-2 py-2 text-sm text-gray-800 dark:text-gray-100">
            <input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)} />
            {form.active ? 'Activa' : 'Inactiva'}
          </label>
        </Field>
        <Field label="Nota para a auditoria" hint="Opcional">
          <input className={inputClasses} value={form.note} onChange={e => update('note', e.target.value)} maxLength={300} />
        </Field>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Âmbito</h2>
        <Field label="Regiões" hint="Vazio = todas. Separadas por vírgula (AO-LUA, AO-BGU)">
          <input className={inputClasses} value={form.regions} onChange={e => update('regions', e.target.value)} />
        </Field>
        <Field label="Tipos de corrida" hint="Vazio = todos">
          <Chips options={RIDE_TYPES} selected={form.ride_types} label={t => RIDE_TYPE_LABELS[t]} onToggle={t => update('ride_types', toggle(form.ride_types, t))} />
        </Field>
        <Field label="Veículos" hint="Vazio = motas e carros; uma regra só para motas escolhe Mota">
          <Chips options={VEHICLE_TYPES} selected={form.vehicle_types} label={v => VEHICLE_TYPE_LABELS[v]} onToggle={v => update('vehicle_types', toggle(form.vehicle_types, v))} />
        </Field>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Condições</h2>
        <p className="text-xs text-gray-500">Pelo menos uma. As que ficam vazias não restringem.</p>
        <Field label="Clima">
          <Chips options={ALL_WEATHER} selected={form.weather} label={w => WEATHER_LABELS[w]} onToggle={w => update('weather', toggle(form.weather, w))} />
        </Field>
        <Field label="Dias da semana">
          <Chips options={ALL_DAYS} selected={form.days_of_week} label={d => DAY_LABELS[d]} onToggle={d => update('days_of_week', toggle(form.days_of_week, d).sort((a, b) => a - b))} />
        </Field>
        <Field label="Janelas horárias" hint="Fim exclusivo; pode passar a meia-noite">
          <div className="flex flex-col gap-2">
            {form.time_windows.map((w, i) => (
              <div key={`${i}-${w.start_time}`} className="flex items-center gap-2">
                <input className={`${inputClasses} max-w-28`} value={w.start_time} placeholder="HH:mm" onChange={e => update('time_windows', form.time_windows.map((x, j) => (j === i ? { ...x, start_time: e.target.value } : x)))} />
                <span className="text-gray-400">→</span>
                <input className={`${inputClasses} max-w-28`} value={w.end_time} placeholder="HH:mm" onChange={e => update('time_windows', form.time_windows.map((x, j) => (j === i ? { ...x, end_time: e.target.value } : x)))} />
                <button type="button" aria-label="Remover janela" onClick={() => update('time_windows', form.time_windows.filter((_, j) => j !== i))} className="p-2 text-gray-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => update('time_windows', [...form.time_windows, { start_time: '17:00', end_time: '19:30' }])} className="inline-flex items-center gap-1 text-xs font-medium text-primary-200 hover:underline self-start">
              <Plus size={14} /> Acrescentar janela
            </button>
          </div>
        </Field>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Tipo de acréscimo">
          <select className={inputClasses} value={form.kind} onChange={e => update('kind', e.target.value as SurchargeKind)}>
            <option value="percent">Percentagem do custo base + distância</option>
            <option value="fixed">Valor fixo (Kz)</option>
          </select>
        </Field>
        <Field label={form.kind === 'percent' ? 'Percentagem' : 'Valor (Kz)'} hint="Nunca negativo — descontos são promoções">
          <input className={inputClasses} type="number" min={0} step="0.1" value={form.value} onChange={e => update('value', Number(e.target.value))} />
        </Field>
        <Field label="Parte do motorista no acréscimo (%)" hint="Vazio = repartição normal do perfil">
          <input className={inputClasses} type="number" min={0} max={100} value={form.surcharge_driver_share} onChange={e => update('surcharge_driver_share', e.target.value)} placeholder="normal" />
        </Field>
        <Field label="Válida desde" hint="Opcional">
          <input className={inputClasses} type="date" value={form.valid_from} onChange={e => update('valid_from', e.target.value)} />
        </Field>
        <Field label="Válida até" hint="Opcional">
          <input className={inputClasses} type="date" value={form.valid_until} onChange={e => update('valid_until', e.target.value)} />
        </Field>
      </section>

      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
          <p className="font-semibold mb-1">A validação da lib recusa esta regra:</p>
          <ul className="list-disc pl-5">
            {errors.map(e => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Link to={routsNameMain.pricing.rules} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200">
          Cancelar
        </Link>
        <button type="submit" disabled={submitting || errors.length > 0} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-200 text-white text-sm font-medium disabled:opacity-50">
          {submitting ? <Spinner size={16} className="animate-spin" /> : <Save size={16} />}
          Gravar regra
        </button>
      </div>
    </form>
  )
}
