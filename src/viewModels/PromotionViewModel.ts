// viewModels/PromotionViewModel.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PromotionEntity } from '@/core/entities/Promotion'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { promotionUseCase } from '@/domain/usecases/promotionUseCase'
import type {
  CreatePromotionPayload,
  PromotionPayload
} from '@/core/interfaces/IAdminPromotionRepository'

/*
 * ⚠️ **Sem `withAudit` nas escritas.** As cinco passam pela API, que escreve
 * em `auditLogs` dentro da própria transacção da alteração — o registo não
 * pode existir sem a alteração, nem a alteração sem o registo. É o mesmo que
 * o `payMissionProgress` do `MissionViewModel` já faz, e pela mesma razão.
 *
 * O `withAudit` que aqui estava corria **no browser, depois da escrita**: um
 * documento separado, a falhar em silêncio, a não escrever nada se o
 * `auditService.setAdmin` não tivesse corrido, e a gravar os dois documentos
 * inteiros em vez de campo a campo. Mantê-lo agora dava duas linhas por
 * alteração, uma delas pior.
 */

export function usePromotionsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<PromotionEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: [firebaseCollections.promotions.root]
    })

  const {
    data,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<PromotionEntity[]>>({
    queryKey: [
      firebaseCollections.promotions.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () =>
      promotionUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 30
  })

  const createPromotion = useMutation({
    mutationFn: (input: CreatePromotionPayload) =>
      promotionUseCase.executeCreate(input),
    onSuccess: invalidate
  })

  const updatePromotion = useMutation({
    mutationFn: ({
      code,
      payload
    }: {
      code: string
      payload: PromotionPayload
    }) => promotionUseCase.executeUpdate(code, payload),
    onSuccess: invalidate
  })

  const toggleActive = useMutation({
    mutationFn: ({ code, active }: { code: string; active: boolean }) =>
      promotionUseCase.executeSetActive(code, active),
    onSuccess: invalidate
  })

  const addAllowedUsersBulk = useMutation({
    // O admin vem do token, no servidor: `added_by` já não se manda daqui.
    mutationFn: ({ code, userIds }: { code: string; userIds: string[] }) =>
      promotionUseCase.executeAddAllowedUsersBulk(code, userIds)
  })

  return {
    promotions: data?.data ?? [],
    pagination: data?.pagination,
    loading,
    error,
    refetch,
    createPromotion,
    updatePromotion,
    toggleActive,
    addAllowedUsersBulk
  }
}

export function usePromotionDetailViewModel(code: string | undefined) {
  const promotionQuery = useQuery({
    queryKey: [firebaseCollections.promotions.root, 'detail', code],
    queryFn: () => promotionUseCase.executeGetByCode(code!),
    enabled: !!code,
    staleTime: 30 * 1000
  })

  const usagesQuery = useQuery({
    queryKey: [firebaseCollections.promotions.root, 'usages', code],
    queryFn: () => promotionUseCase.executeListUsages(code!, 200),
    enabled: !!code,
    staleTime: 60 * 1000
  })

  const allowedUsersQuery = useQuery({
    queryKey: [firebaseCollections.promotions.root, 'allowed', code],
    queryFn: () => promotionUseCase.executeListAllowedUsers(code!),
    enabled: !!code && !!promotionQuery.data?.rules?.has_specific_users,
    staleTime: 60 * 1000
  })

  return {
    promotion: promotionQuery.data ?? null,
    usages: usagesQuery.data ?? [],
    allowedUsers: allowedUsersQuery.data ?? [],
    isLoading:
      promotionQuery.isLoading ||
      usagesQuery.isLoading ||
      allowedUsersQuery.isLoading,
    error: promotionQuery.error ?? usagesQuery.error,
    refetch: () => {
      promotionQuery.refetch()
      usagesQuery.refetch()
      allowedUsersQuery.refetch()
    }
  }
}
