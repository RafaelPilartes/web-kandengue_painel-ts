import type { DayOfWeek, WeatherCondition } from '@rafaelpilartes/kandengue-shared/types'

// Etiquetas de interface das condições das regras. Os valores são os da lib.
export const WEATHER_LABELS: Record<WeatherCondition, string> = {
  clear: 'Sem chuva',
  rain_light: 'Chuva fraca',
  rain_heavy: 'Chuva forte'
}

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb'
}

export const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]
export const ALL_WEATHER: WeatherCondition[] = ['clear', 'rain_light', 'rain_heavy']
