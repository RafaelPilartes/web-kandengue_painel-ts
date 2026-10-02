import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiRepository } from '@/modules/Api/factory'
import type { WeatherOverrideInput } from '@/core/interfaces/IPricingRepository'

export const WEATHER_KEYS = {
  region: (region?: string) => ['weather', region ?? 'default'] as const
}

/**
 * O clima da região, e a chuva manual.
 *
 * Lê pela API e não do Firestore: o documento sozinho não responde à pergunta
 * que interessa — **qual das duas fontes está a contar agora**. A chuva
 * manual expira sozinha e uma leitura automática velha deixa de valer, e é o
 * `resolveWeather` da lib, no servidor, que decide. Reimplementar essa
 * decisão aqui era ter duas respostas para a mesma pergunta.
 *
 * `refetchInterval`: a chuva manual tem um fim, e o ecrã tem de deixar de a
 * mostrar quando ela acaba sem ninguém carregar em nada.
 */
export function useWeatherViewModel(region?: string) {
  const queryClient = useQueryClient()

  const weather = useQuery({
    queryKey: WEATHER_KEYS.region(region),
    queryFn: () => ApiRepository.pricing.getWeather(region),
    refetchInterval: 60_000
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: WEATHER_KEYS.region(region) })

  const setOverride = useMutation({
    mutationFn: (input: WeatherOverrideInput) =>
      ApiRepository.pricing.setWeatherOverride({ ...input, region }),
    onSuccess: invalidate
  })

  const clearOverride = useMutation({
    mutationFn: () => ApiRepository.pricing.clearWeatherOverride(region),
    onSuccess: invalidate
  })

  return {
    weather: weather.data ?? null,
    isLoadingWeather: weather.isLoading,
    refetchWeather: weather.refetch,
    setOverride,
    clearOverride
  }
}
