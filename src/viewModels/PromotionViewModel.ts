// viewModels/PromotionViewModel.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PromotionEntity } from '@/core/entities/Promotion'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { PromotionService } from '@/routes/services/promotion.service'
import { useAdminStore } from '@/stores/userStore'

const promotionService = new PromotionService()

export function usePromotionsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<PromotionEntity>
) {
  const queryClient = useQueryClient()
  const { currentAdminData } = useAdminStore()
  const adminId = currentAdminData?.id ?? 'unknown'

  const filtersKey = filters ? JSON.stringify(filters) : ''

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
    queryFn: () => promotionService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 30
  })

  const createPromotion = useMutation({
    mutationFn: (input: Omit<PromotionEntity, 'id'>) =>
      promotionService.create({
        ...input,
        created_by: input.created_by ?? adminId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.promotions.root]
      })
    }
  })

  const updatePromotion = useMutation({
    mutationFn: ({
      code,
      patch
    }: {
      code: string
      patch: Partial<PromotionEntity>
    }) => promotionService.update(code, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.promotions.root]
      })
    }
  })

  const toggleActive = useMutation({
    mutationFn: ({ code, active }: { code: string; active: boolean }) =>
      promotionService.setActive(code, active),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.promotions.root]
      })
    }
  })

  const addAllowedUsersBulk = useMutation({
    mutationFn: ({ code, userIds }: { code: string; userIds: string[] }) =>
      promotionService.addAllowedUsersBulk(code, userIds, adminId)
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
    queryFn: () => promotionService.getByCode(code!),
    enabled: !!code,
    staleTime: 30 * 1000
  })

  const usagesQuery = useQuery({
    queryKey: [firebaseCollections.promotions.root, 'usages', code],
    queryFn: () => promotionService.listUsages(code!, 200),
    enabled: !!code,
    staleTime: 60 * 1000
  })

  const allowedUsersQuery = useQuery({
    queryKey: [firebaseCollections.promotions.root, 'allowed', code],
    queryFn: () => promotionService.listAllowedUsers(code!),
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
