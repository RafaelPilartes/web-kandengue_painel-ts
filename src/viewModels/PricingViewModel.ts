// viewModels/PricingViewModel.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PricingProfileInterface,
  PricingRuleInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type {
  PricingProfileInput,
  PricingRuleInput
} from '@/core/interfaces/IPricingRepository'
import { ApiRepository } from '@/modules/Api/factory'
import { withAudit } from '@/observability/audit'

/**
 * Perfis de preço: lidos e escritos pela API. A auditoria de preços
 * (`pricingAuditLogs`, com o antes e o depois) é escrita pela API na mesma
 * transacção; aqui fica a linha de `auditLogs` do painel, que é o que o ecrã
 * de auditoria já lista.
 */
export function usePricingProfilesViewModel() {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useQuery<PricingProfileInterface[]>({
    queryKey: [firebaseCollections.pricingProfiles.root],
    queryFn: () => ApiRepository.pricing.listProfiles(),
    staleTime: 1000 * 30
  })

  const saveProfile = useMutation({
    mutationFn: (input: PricingProfileInput) => {
      const label = `${input.region}_${input.ride_type}_${input.vehicle_type}`
      return withAudit(() => ApiRepository.pricing.saveProfile(input), {
        action: 'update',
        module: 'pricing',
        description: `Gravou o perfil de preço ${label} (${input.active ? 'activo' : 'inactivo'})`,
        target_id: label,
        target_type: 'pricing_profile',
        new_data: input
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.pricingProfiles.root]
      })
    }
  })

  return { profiles: data ?? [], loading, error, refetch, saveProfile }
}

export function usePricingRulesViewModel() {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useQuery<PricingRuleInterface[]>({
    queryKey: [firebaseCollections.pricingRules.root],
    queryFn: () => ApiRepository.pricing.listRules(),
    staleTime: 1000 * 30
  })

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: [firebaseCollections.pricingRules.root]
    })

  const saveRule = useMutation({
    mutationFn: (input: PricingRuleInput) =>
      withAudit(() => ApiRepository.pricing.saveRule(input), {
        action: input.id ? 'update' : 'create',
        module: 'pricing',
        description: `Gravou a regra de acréscimo "${input.name}"`,
        target_id: input.id ?? input.name,
        target_type: 'pricing_rule',
        new_data: input
      }),
    onSuccess: invalidate
  })

  const deleteRule = useMutation({
    mutationFn: (rule: PricingRuleInterface) =>
      withAudit(() => ApiRepository.pricing.deleteRule(rule.id), {
        action: 'delete',
        module: 'pricing',
        description: `Apagou a regra de acréscimo "${rule.name}"`,
        target_id: rule.id,
        target_type: 'pricing_rule',
        previous_data: rule
      }),
    onSuccess: invalidate
  })

  return { rules: data ?? [], loading, error, refetch, saveRule, deleteRule }
}
