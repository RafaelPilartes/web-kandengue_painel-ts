/**
 * Estas etiquetas vivem agora em `@rafaelpilartes/kandengue-shared/constants`.
 *
 * Estavam aqui, e o ecrã da chuva manual e o simulador precisavam das mesmas
 * — três cópias da mesma palavra é como se acaba com três palavras
 * diferentes para a mesma coisa no mesmo painel. Reexporta-se com os nomes
 * antigos para os imports existentes continuarem a valer.
 */
import {
  DAY_OF_WEEK_LABELS,
  DAYS_OF_WEEK,
  WEATHER_CONDITION_LABELS,
  WEATHER_CONDITIONS
} from '@rafaelpilartes/kandengue-shared/constants'
import type { DayOfWeek, WeatherCondition } from '@rafaelpilartes/kandengue-shared/types'

export const WEATHER_LABELS: Record<WeatherCondition, string> =
  WEATHER_CONDITION_LABELS
export const DAY_LABELS: Record<DayOfWeek, string> = DAY_OF_WEEK_LABELS

export const ALL_DAYS: DayOfWeek[] = [...DAYS_OF_WEEK]
export const ALL_WEATHER: WeatherCondition[] = [...WEATHER_CONDITIONS]
