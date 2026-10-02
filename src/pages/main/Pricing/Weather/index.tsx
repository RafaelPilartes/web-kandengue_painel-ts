import { useState } from 'react'
import { Spinner } from 'phosphor-react'
import swal from 'sweetalert'
import { CloudRain, RotateCcw, Sun } from 'lucide-react'
import {
  WEATHER_AUTO_MAX_AGE_MINUTES,
  WEATHER_CONDITION_LABELS,
  WEATHER_MANUAL_OVERRIDE_DEFAULT_MINUTES,
  WEATHER_MANUAL_OVERRIDE_MAX_MINUTES,
  WEATHER_SOURCE_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import type { WeatherCondition } from '@rafaelpilartes/kandengue-shared/types'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BadgeSimple } from '@/components/badge/BadgeSimple'
import { useWeatherViewModel } from '@/viewModels/WeatherViewModel'
import { formatDateTimeFromFirestore } from '@/utils/date'

/** Minutos até uma data, ou `null` se já passou. */
function minutosAte(date: Date): number | null {
  const diff = date.getTime() - Date.now()
  return diff > 0 ? Math.ceil(diff / 60_000) : null
}

function duracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

const DURACOES = [60, WEATHER_MANUAL_OVERRIDE_DEFAULT_MINUTES, 240, WEATHER_MANUAL_OVERRIDE_MAX_MINUTES]

/**
 * A chuva manual.
 *
 * O clima entra no preço por regras de acréscimo condicionais, e a leitura
 * automática pode falhar ou atrasar-se. Este ecrã mostra as duas fontes e,
 * sobretudo, **qual delas está a contar agora** — que é a única pergunta que
 * importa quando se está a decidir se se liga a chuva à mão.
 *
 * A duração é obrigatória por desenho: uma chuva manual sem fim era uma
 * chuva esquecida a cobrar acréscimo em dias de sol.
 */
export function WeatherPage() {
  const {
    weather,
    isLoadingWeather,
    refetchWeather,
    setOverride,
    clearOverride
  } = useWeatherViewModel()

  const [condicao, setCondicao] = useState<WeatherCondition>('rain_light')
  const [minutos, setMinutos] = useState<number>(
    WEATHER_MANUAL_OVERRIDE_DEFAULT_MINUTES
  )
  const [motivo, setMotivo] = useState('')

  const itemsBreadcrumbs = [
    { label: 'Início', to: '/' },
    { label: 'Chuva manual' }
  ]

  const state = weather?.state ?? null
  const resolved = weather?.resolved ?? null
  const override = state?.manual_override ?? null
  const auto = state?.auto ?? null

  const restam = override ? minutosAte(override.expires_at) : null
  const activa = restam !== null

  const idadeAuto = auto
    ? Math.floor((Date.now() - auto.observed_at.getTime()) / 60_000)
    : null
  const autoVelha =
    idadeAuto !== null && idadeAuto > WEATHER_AUTO_MAX_AGE_MINUTES

  async function handleActivar() {
    const confirma = await swal({
      title: `Activar ${WEATHER_CONDITION_LABELS[condicao].toLowerCase()}?`,
      text:
        `Durante ${duracao(minutos)}. Enquanto estiver activa, as regras de ` +
        'acréscimo por chuva aplicam-se a todas as cotações novas.' +
        (activa ? '\n\nIsto substitui a chuva manual que já está activa.' : ''),
      buttons: ['Cancelar', 'Activar'],
      icon: 'warning'
    })
    if (!confirma) return

    try {
      await setOverride.mutateAsync({
        condition: condicao,
        duration_minutes: minutos,
        reason: motivo || undefined
      })
      setMotivo('')
      swal('Chuva manual activada', { icon: 'success' })
    } catch (error) {
      swal('Erro ao activar', {
        text:
          error instanceof Error
            ? error.message
            : 'Houve algum erro ao activar a chuva manual...',
        icon: 'error'
      })
    }
  }

  async function handleLimpar() {
    const confirma = await swal({
      title: 'Voltar ao automático?',
      text: 'As cotações novas passam a usar a leitura automática.',
      buttons: ['Cancelar', 'Voltar ao automático'],
      icon: 'warning'
    })
    if (!confirma) return

    try {
      await clearOverride.mutateAsync()
      swal('De volta ao automático', { icon: 'success' })
    } catch (error) {
      swal('Erro ao limpar', {
        text:
          error instanceof Error
            ? error.message
            : 'Houve algum erro ao limpar a chuva manual...',
        icon: 'error'
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Chuva manual
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          O clima entra no preço pelas regras de acréscimo. Quando a leitura
          automática não acompanha o que se vê na rua, activa-se à mão — sempre
          com um fim.
        </p>
      </div>

      {isLoadingWeather ? (
        <div className="w-full py-16 flex justify-center">
          <Spinner size={28} className="text-primary-200 animate-spin" />
        </div>
      ) : (
        <>
          {/* O que está a contar AGORA. É a pergunta do ecrã. */}
          <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-4">
            <div className="flex flex-row flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  A contar agora, na região {state?.id ?? 'AO-LUA'}
                </span>
                <span className="text-2xl font-bold text-dark dark:text-light flex items-center gap-2">
                  {resolved?.condition === 'clear' ? (
                    <Sun size={24} className="text-amber-500" />
                  ) : (
                    <CloudRain size={24} className="text-blue-500" />
                  )}
                  {resolved
                    ? WEATHER_CONDITION_LABELS[resolved.condition]
                    : '—'}
                </span>
                {resolved && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {WEATHER_SOURCE_LABELS[resolved.source]}
                  </span>
                )}
              </div>

              <div className="flex flex-row items-center gap-3">
                {activa ? (
                  <BadgeSimple label="Manual" color="blue" />
                ) : (
                  <BadgeSimple label="Automático" color="green" />
                )}
                <button
                  type="button"
                  onClick={() => refetchWeather()}
                  title="Reler agora"
                  className="p-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {/* Última leitura automática */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Última leitura automática
                </span>
                {auto ? (
                  <>
                    <span className="text-sm font-semibold text-dark dark:text-light">
                      {WEATHER_CONDITION_LABELS[auto.condition]} ·{' '}
                      {auto.precipitation_mm_h} mm/h
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTimeFromFirestore(auto.observed_at).date} às{' '}
                      {formatDateTimeFromFirestore(auto.observed_at).time} ·{' '}
                      {auto.source}
                      {idadeAuto !== null ? ` · há ${duracao(idadeAuto)}` : ''}
                    </span>
                    {autoVelha && (
                      // Uma leitura acima dos 30 min deixa de valer: o motor
                      // volta a "sem chuva". É aqui que se vê que o job de
                      // clima parou.
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Acima dos {WEATHER_AUTO_MAX_AGE_MINUTES} min — o motor
                        já não a usa
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400">
                    Nenhuma leitura gravada
                  </span>
                )}
              </div>

              {/* Chuva manual */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Chuva manual
                </span>
                {activa && override ? (
                  <>
                    <span className="text-sm font-semibold text-dark dark:text-light">
                      {WEATHER_CONDITION_LABELS[override.condition]} · termina
                      em {duracao(restam)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Até às{' '}
                      {formatDateTimeFromFirestore(override.expires_at).time},
                      activada por {override.set_by}
                    </span>
                    {override.reason && (
                      <span className="text-xs text-gray-600 dark:text-gray-300 italic">
                        “{override.reason}”
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400">
                    {override
                      ? 'Expirou — já não conta'
                      : 'Nenhuma activa'}
                  </span>
                )}
              </div>
            </div>

            {activa && (
              <button
                type="button"
                onClick={handleLimpar}
                disabled={clearOverride.isPending}
                className="self-start px-5 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {clearOverride.isPending
                  ? 'A limpar…'
                  : 'Voltar ao automático agora'}
              </button>
            )}
          </div>

          {/* Activar */}
          <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-5">
            <h2 className="text-lg font-bold text-dark dark:text-light">
              {activa ? 'Substituir a chuva manual' : 'Activar chuva manual'}
            </h2>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Condição
              </span>
              <div className="flex flex-row flex-wrap gap-2">
                {(['rain_light', 'rain_heavy', 'clear'] as WeatherCondition[]).map(
                  c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondicao(c)}
                      className={`px-4 py-2 rounded-md text-sm font-semibold border ${
                        condicao === c
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {WEATHER_CONDITION_LABELS[c]}
                    </button>
                  )
                )}
              </div>
              {condicao === 'clear' && (
                // Forçar "sem chuva" é um caso real: a leitura automática diz
                // que chove e na rua não chove.
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Força "sem chuva" mesmo que a leitura automática diga o
                  contrário.
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Duração — máximo {duracao(WEATHER_MANUAL_OVERRIDE_MAX_MINUTES)},
                validado no servidor
              </span>
              <div className="flex flex-row flex-wrap gap-2">
                {DURACOES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinutos(m)}
                    className={`px-4 py-2 rounded-md text-sm font-semibold border ${
                      minutos === m
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {duracao(m)}
                    {m === WEATHER_MANUAL_OVERRIDE_DEFAULT_MINUTES && (
                      <span className="ml-1 text-[10px] opacity-70">
                        (omissão)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Motivo (opcional) — fica no documento e na auditoria
              </span>
              <input
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                maxLength={200}
                placeholder="Ex.: chuva forte na Marginal, leitura automática não acompanha"
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100"
              />
            </label>

            <button
              type="button"
              onClick={handleActivar}
              disabled={setOverride.isPending}
              className="self-start px-6 py-2 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
            >
              {setOverride.isPending
                ? 'A activar…'
                : `Activar ${WEATHER_CONDITION_LABELS[condicao].toLowerCase()} por ${duracao(minutos)}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
