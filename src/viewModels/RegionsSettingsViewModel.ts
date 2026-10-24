// viewModels/RegionsSettingsViewModel.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { IRegionsSettings } from '@/core/interfaces/IAppConfigRepository'
import { appConfigUseCase } from '@/domain/usecases/appConfigUseCase'
import { useAdminStore } from '@/stores/userStore'
import { withAudit } from '@/observability/audit'

const KEY = ['app_config', 'regions']

/**
 * The region check's switch.
 *
 * ⚠️ **`withAudit` belongs here, unlike in `AppConfigViewModel`.** The panel's
 * rule is that a write going *through the API* must not call it — the server
 * writes `auditLogs` inside the transaction of the change itself. This one
 * writes straight to Firestore, so the browser-side record is the only record
 * there is.
 *
 * ⚠️ **No `staleTime`.** Every other settings screen caches for a minute; this
 * is the brake someone reaches for while rides are being refused, and a stale
 * "está ligado" on that screen is the worst possible answer. It costs one
 * document read.
 */
export function useRegionsSettingsViewModel() {
  const queryClient = useQueryClient()
  const { currentAdminData } = useAdminStore()
  const adminId = currentAdminData?.id ?? 'unknown'

  const settingsQuery = useQuery<IRegionsSettings>({
    queryKey: KEY,
    queryFn: () => appConfigUseCase.executeGetRegionsSettings()
  })

  const update = useMutation({
    mutationFn: (enabled: boolean) =>
      withAudit(
        () =>
          appConfigUseCase.executeUpdateRegionsEnforcement(enabled, adminId),
        {
          action: 'update',
          module: 'settings',
          // A refusal that stops, or starts, for every passenger in the
          // country is not a routine settings change.
          severity: 'critical',
          description: enabled
            ? 'Ligou a verificação de região (as corridas fora das províncias servidas voltam a ser recusadas)'
            : 'DESLIGOU a verificação de região (as corridas passam a ser aceites em qualquer província)',
          target_id: 'app_config/regions',
          target_type: 'app_config',
          new_data: { enforcement_enabled: enabled }
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
    }
  })

  return {
    settings: settingsQuery.data ?? null,
    /*
     * While the document is loading, claim it is **on**: that is both the
     * API's default and the safer thing to show. A switch that renders off and
     * then flicks on invites someone to "fix" it.
     */
    enabled: settingsQuery.data?.enforcement_enabled ?? true,
    exists: settingsQuery.data?.exists ?? false,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
    setEnabled: update.mutateAsync,
    isSubmitting: update.isPending
  }
}
