import { useMemo, useState } from 'react'
import { Spinner } from 'phosphor-react'
import { AlertTriangle, Calculator } from 'lucide-react'
import {
  DAY_OF_WEEK_LABELS,
  DAYS_OF_WEEK,
  DEFAULT_REGION,
  RIDE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS,
  WEATHER_CONDITION_LABELS,
  WEATHER_CONDITIONS
} from '@rafaelpilartes/kandengue-shared/constants'
import type {
  PricingProfileInterface,
  PricingSnapshotInterface,
  RideFareV2Interface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import { simulateFare } from '@/utils/simulateFare'
import type { DayOfWeek, WeatherCondition } from '@rafaelpilartes/kandengue-shared/types'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BadgeSimple } from '@/components/badge/BadgeSimple'
import {
  usePricingProfilesViewModel,
  usePricingRulesViewModel
} from '@/viewModels/PricingViewModel'
import { formatMoney, formatKwanza } from '@/utils/number'

/**
 * Simulador de tarifas. **Só leitura — não grava nada.**
 *
 * Corre o `buildPricingSnapshot` e o `computeFare` da lib no browser, com os
 * perfis e as regras que estão em produção. É o mesmo código que o servidor
 * corre ao cotar: se o simulador e a cotação discordarem, é porque os dados
 * mudaram entre as duas, não porque há duas contas.
 *
 * Não usa a rota de cotação de propósito: um `POST /pricing/quote` **grava**
 * um documento em `fareQuotes` e consome uma cotação. Simular cem cenários
 * deixava cem cotações para o TTL limpar.
 */
export function SimulatorPage() {
  const { profiles, loading: loadingProfiles } = usePricingProfilesViewModel()
  const { rules, loading: loadingRules } = usePricingRulesViewModel()

  const [profileId, setProfileId] = useState<string>('')
  const [distanciaKm, setDistanciaKm] = useState<number>(5)
  const [esperaMin, setEsperaMin] = useState<number>(0)
  const [dia, setDia] = useState<DayOfWeek>(1)
  const [hora, setHora] = useState<number>(10)
  const [minuto, setMinuto] = useState<number>(0)
  const [clima, setClima] = useState<WeatherCondition>('clear')
  const [desconto, setDesconto] = useState<number>(0)

  const naRegiao = useMemo(
    () => profiles.filter(p => p.region === DEFAULT_REGION),
    [profiles]
  )

  const perfil: PricingProfileInterface | null = useMemo(() => {
    if (profileId) return naRegiao.find(p => p.id === profileId) ?? null
    // Por omissão, o primeiro activo — é o que está a ser vendido.
    return naRegiao.find(p => p.active) ?? naRegiao[0] ?? null
  }, [naRegiao, profileId])

  const resultado = useMemo(() => {
    if (!perfil) return null
    return simulateFare({
      profile: perfil,
      rules,
      day_of_week: dia,
      hour: hora,
      minute: minuto,
      weather: clima,
      distance_km: distanciaKm,
      wait_minutes: esperaMin,
      discount: desconto
    })
  }, [perfil, rules, dia, hora, minuto, clima, distanciaKm, esperaMin, desconto])

  const itemsBreadcrumbs = [
    { label: 'Início', to: '/' },
    { label: 'Simulador de tarifas' }
  ]

  if (loadingProfiles || loadingRules) {
    return (
      <div className="w-full py-16 flex justify-center">
        <Spinner size={28} className="text-primary-200 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Simulador de tarifas
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Corre o mesmo cálculo da lib que o servidor corre ao cotar, com os
          perfis e as regras que estão em produção.{' '}
          <strong>Não grava nada</strong> — nem cotações.
        </p>
      </div>

      <div className="w-full grid gap-6 lg:grid-cols-5">
        {/* Entradas */}
        <div className="lg:col-span-2 p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-5">
          <h2 className="text-lg font-bold text-dark dark:text-light">
            Cenário
          </h2>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Perfil — corrida × veículo
            </span>
            <select
              value={perfil?.id ?? ''}
              onChange={e => setProfileId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100"
            >
              {naRegiao.map(p => (
                <option key={p.id} value={p.id}>
                  {RIDE_TYPE_LABELS[p.ride_type]} ·{' '}
                  {VEHICLE_TYPE_LABELS[p.vehicle_type]}
                  {p.active ? '' : ' (inactivo)'}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Numero
              label="Distância (km)"
              value={distanciaKm}
              min={0}
              step={0.1}
              onChange={setDistanciaKm}
            />
            <Numero
              label="Espera (min)"
              value={esperaMin}
              min={0}
              onChange={setEsperaMin}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Dia da semana
            </span>
            <div className="flex flex-row flex-wrap gap-1">
              {DAYS_OF_WEEK.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDia(d)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                    dia === d
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {DAY_OF_WEEK_LABELS[d]}
                </button>
              ))}
            </div>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <Numero label="Hora" value={hora} min={0} max={23} onChange={setHora} />
            <Numero
              label="Minuto"
              value={minuto}
              min={0}
              max={59}
              onChange={setMinuto}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Clima
            </span>
            <div className="flex flex-row flex-wrap gap-1">
              {WEATHER_CONDITIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setClima(c)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${
                    clima === c
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {WEATHER_CONDITION_LABELS[c]}
                </button>
              ))}
            </div>
          </label>

          <Numero
            label="Desconto de promoção (Kz)"
            value={desconto}
            min={0}
            onChange={setDesconto}
          />
        </div>

        {/* Resultado */}
        <div className="lg:col-span-3 p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-5">
          <h2 className="text-lg font-bold text-dark dark:text-light flex items-center gap-2">
            <Calculator size={18} className="text-gray-400" />
            Resultado
          </h2>

          {!resultado ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum perfil de preço nesta região.
            </p>
          ) : !resultado.ok ? (
            <div className="flex flex-row items-start gap-2 p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
              <AlertTriangle
                size={16}
                className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0"
              />
              <p className="text-sm text-gray-700 dark:text-gray-200">
                {resultado.error}
              </p>
            </div>
          ) : (
            <Breakdown
              snapshot={resultado.snapshot}
              fare={resultado.fare}
              hora={`${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`}
              dia={dia}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Breakdown({
  snapshot,
  fare,
  hora,
  dia
}: {
  snapshot: PricingSnapshotInterface
  fare: RideFareV2Interface
  hora: string
  dia: DayOfWeek
}) {
  const b = fare.breakdown
  const band = snapshot.rate_band

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-row items-baseline justify-between">
        <span className="text-3xl font-bold text-dark dark:text-light">
          AOA {formatMoney(fare.total)}
        </span>
        <BadgeSimple
          label={`${DAY_OF_WEEK_LABELS[dia]} ${hora} · faixa ${band.start_time}–${band.end_time}`}
          color="blue"
        />
      </div>

      {/* A conta, linha a linha, na ordem em que a lib a faz. */}
      <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
        <Linha label="Base" value={b.base_fare} hint={`faixa: ${formatMoney(band.base_fare)}`} />
        <Linha
          label="Distância"
          value={b.distance_cost}
          hint={`${formatMoney(band.price_per_km)}/km`}
        />
        <Linha
          label="Espera"
          value={b.wait_cost}
          hint={`${formatMoney(band.price_per_minute)}/min após ${band.wait_time_free_minutes} min grátis`}
        />

        {!!b.surcharge_amount && (
          <Linha label="Acréscimo das regras" value={b.surcharge_amount} />
        )}
        {!!b.min_fare_adjustment && (
          <Linha
            label="Ajuste ao mínimo do perfil"
            value={b.min_fare_adjustment}
            hint={`min_fare ${formatMoney(snapshot.min_fare)}`}
          />
        )}
        {!!b.min_final_adjustment && (
          <Linha label="Ajuste ao limite inferior" value={b.min_final_adjustment} />
        )}

        <Linha label="Subtotal" value={b.subtotal} forte />
        <Linha
          label="Seguro"
          value={b.insurance_fee}
          hint={`${snapshot.insurance_percent}% — cobra-se por cima e não se reparte`}
        />
        <Linha label="Bruto" value={b.gross_amount} forte />
        {!!b.discount && (
          <Linha label="Desconto" value={-b.discount} hint="limitado ao subtotal" />
        )}
        <Linha label="Total" value={fare.total} forte />
      </div>

      {/* As regras que entraram, e porquê. */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Regras aplicadas
        </h3>
        {snapshot.applied_rules.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Nenhuma regra de acréscimo corresponde a este cenário.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {snapshot.applied_rules.map(rule => (
              <li
                key={rule.rule_id}
                className="text-xs text-gray-700 dark:text-gray-200 flex flex-row justify-between gap-4"
              >
                <span>
                  {rule.name}{' '}
                  <span className="text-gray-400">
                    ({rule.stack_group} · v{rule.rule_version})
                  </span>
                </span>
                <span className="font-semibold whitespace-nowrap">
                  {rule.kind === 'percent'
                    ? `+${rule.value}%`
                    : `+${formatKwanza(rule.value)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        {!!b.surcharge_amount && (
          <p className="mt-2 text-[11px] text-gray-400">
            O acréscimo está limitado a {snapshot.max_surcharge_percent}% de
            base + distância — o tecto é aplicado à soma, não regra a regra.
          </p>
        )}
      </div>

      {/* A repartição. */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Repartição
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Parcela label="Motorista" value={fare.payouts.driver_earnings} />
          <Parcela label="Empresa" value={fare.payouts.company_earnings} />
          <Parcela label="Fundo" value={fare.payouts.pension_fund} />
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          Perfil {snapshot.profile_id} v{snapshot.profile_version}
        </p>
      </div>
    </div>
  )
}

function Linha({
  label,
  value,
  hint,
  forte
}: {
  label: string
  value: number
  hint?: string
  forte?: boolean
}) {
  return (
    <div className="flex flex-row items-baseline justify-between py-2 gap-4">
      <span
        className={`text-sm ${
          forte
            ? 'font-bold text-dark dark:text-light'
            : 'text-gray-600 dark:text-gray-300'
        }`}
      >
        {label}
        {hint && (
          <span className="block text-[11px] text-gray-400">{hint}</span>
        )}
      </span>
      <span
        className={`whitespace-nowrap ${
          forte
            ? 'text-base font-bold text-dark dark:text-light'
            : 'text-sm text-gray-700 dark:text-gray-200'
        }`}
      >
        {formatMoney(value)}
      </span>
    </div>
  )
}

function Parcela({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800 flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-base font-bold ${
          value < 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-dark dark:text-light'
        }`}
      >
        {formatMoney(value)}
      </span>
    </div>
  )
}

function Numero({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100"
      />
    </label>
  )
}
