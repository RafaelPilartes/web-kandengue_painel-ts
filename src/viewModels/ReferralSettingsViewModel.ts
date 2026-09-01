// viewModels/ReferralSettingsViewModel.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { IReferralSettings } from '@/interfaces/IPromotion'
import { appConfigUseCase } from '@/domain/usecases/appConfigUseCase'
import { useAdminStore } from '@/stores/userStore'

const KEY = ['app_config', 'referral_settings']

export function useReferralSettingsViewModel() {
  const queryClient = useQueryClient()
  const { currentAdminData } = useAdminStore()
  const adminId = currentAdminData?.id ?? 'unknown'

  const settingsQuery = useQuery<IReferralSettings | null>({
    queryKey: KEY,
    queryFn: () => appConfigUseCase.executeGetReferralSettings(),
    staleTime: 60 * 1000
  })

  const updateSettings = useMutation({
    mutationFn: (minimum: number) =>
      appConfigUseCase.executeUpdateReferralSettings(minimum, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
    }
  })

  return {
    settings: settingsQuery.data ?? null,
    minimum: settingsQuery.data?.minimum_withdrawal_amount ?? 0,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
    updateMinimum: updateSettings.mutateAsync,
    isSubmitting: updateSettings.isPending
  }
}
