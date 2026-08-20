// viewModels/WithdrawalViewModel.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { firebaseCollections } from '@/constants/firebaseCollections'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { WithdrawalStatus } from '@rafaelpilartes/kandengue-shared/withdrawal'
import { WithdrawalService } from '@/services/withdrawal.service'
import {
  ReferralEarningEntity,
  WithdrawalRequestEntity
} from '@/core/entities/Promotion'

const withdrawalService = new WithdrawalService()

const KEY = firebaseCollections.withdrawalRequests.root

export function useWithdrawalsViewModel(filters?: {
  status?: WithdrawalStatus
}) {
  const queryClient = useQueryClient()

  const list = useQuery<ListResponseType<WithdrawalRequestEntity[]>>({
    queryKey: [KEY, 'list', filters?.status ?? 'all'],
    queryFn: () => withdrawalService.getAll(50, 0, filters),
    staleTime: 30 * 1000
  })

  const pendingCount = useQuery({
    queryKey: [KEY, 'count', 'pending'],
    queryFn: () => withdrawalService.countByStatus('pending'),
    staleTime: 30 * 1000
  })

  const approve = useMutation({
    mutationFn: (id: string) => withdrawalService.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] })
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      withdrawalService.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] })
  })

  const markAsPaid = useMutation({
    mutationFn: (id: string) => withdrawalService.markAsPaid(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] })
  })

  return {
    withdrawals: list.data?.data ?? [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    pendingCount: pendingCount.data ?? 0,
    approve,
    reject,
    markAsPaid
  }
}

export function useWithdrawalDetailViewModel(id: string | undefined) {
  const detail = useQuery<WithdrawalRequestEntity | null>({
    queryKey: [KEY, 'detail', id],
    queryFn: () => withdrawalService.getById(id!),
    enabled: !!id,
    staleTime: 30 * 1000
  })

  const earnings = useQuery<ReferralEarningEntity[]>({
    queryKey: [KEY, 'earnings', id],
    queryFn: () =>
      withdrawalService.getEarningsByIds(detail.data?.earning_ids ?? []),
    enabled: !!detail.data?.earning_ids?.length,
    staleTime: 60 * 1000
  })

  return {
    withdrawal: detail.data ?? null,
    earnings: earnings.data ?? [],
    isLoading: detail.isLoading || earnings.isLoading,
    error: detail.error ?? earnings.error,
    refetch: () => {
      detail.refetch()
      earnings.refetch()
    }
  }
}
