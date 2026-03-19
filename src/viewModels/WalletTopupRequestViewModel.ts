// viewModels/WalletTopupRequestViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WalletTopupRequestService } from '@/services/walletTopupRequest.service'
import { WalletTopupRequestEntity } from '@/core/entities/WalletTopupRequest'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo } from 'react'
import { withAudit } from '@/services/audit.service'

const walletTopupRequestService = new WalletTopupRequestService()

export function useWalletTopupRequestsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<WalletTopupRequestEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de Carteiras */
  const {
    data: walletTopupRequestsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<WalletTopupRequestEntity[]>>({
    queryKey: [
      firebaseCollections.requests.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () =>
      walletTopupRequestService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  // transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!walletTopupRequestsResponse?.data) return []
    return walletTopupRequestsResponse?.data.map(doc => ({
      ID: doc.id,
      Carteira: doc.wallet_id,
      Status: doc.status,
      Quantidade: doc.amount,
      'Data de solicitação': doc.created_at,
      'Última atualização': doc.updated_at
    }))
  }, [walletTopupRequestsResponse?.data])

  /** Buscar lista de Carteiras por field */
  const fetchAllWalletTopupRequestsByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await walletTopupRequestService.getAllByField(
        field,
        value,
        limit,
        offset
      )
    } catch (err) {
      console.error('Erro ao buscar solicitações por campo:', err)
      return null
    }
  }

  /** Criar carteira */
  const createWalletTopupRequest = useMutation({
    mutationFn: (walletTopupRequest: Omit<WalletTopupRequestEntity, 'id'>) =>
      withAudit(() => walletTopupRequestService.create(walletTopupRequest), {
        action: 'create',
        module: 'topup_requests',
        description: `Criou solicitação de recarga no valor de ${walletTopupRequest.amount}`,
        target_type: 'topup_request',
        new_data: walletTopupRequest
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.requests.root]
      })
    }
  })

  /** Atualizar carteira */
  const updateWalletTopupRequest = useMutation({
    mutationFn: async ({
      id,
      walletTopupRequest
    }: {
      id: string
      walletTopupRequest: Partial<WalletTopupRequestEntity>
    }) => {
      const previous_data = await walletTopupRequestService.getById(id).catch(() => null)
      return await withAudit(
        () => walletTopupRequestService.update(id, walletTopupRequest),
        {
          action: 'update',
          module: 'topup_requests',
          description: `Atualizou solicitação de recarga - ID: ${id}`,
          target_id: id,
          target_type: 'topup_request',
          previous_data: previous_data || undefined,
          new_data: walletTopupRequest
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.requests.root]
      })
    }
  })

  /** Deletar carteira */
  const deleteWalletTopupRequest = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await walletTopupRequestService.getById(id).catch(() => null)
      return withAudit(() => walletTopupRequestService.delete(id), {
        action: 'delete',
        module: 'topup_requests',
        description: `Excluiu solicitação de recarga - ID: ${id}`,
        target_id: id,
        target_type: 'topup_request',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.requests.root]
      })
    }
  })

  /** Buscar carteira único (on-demand) */
  const fetchWalletTopupRequestById = async (id: string) => {
    try {
      return await walletTopupRequestService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar solicitação:', err)
      return null
    }
  }

  /** Buscar walletTopupRequest por field */
  const fetchOneWalletTopupByField = async (
    field: keyof WalletTopupRequestEntity,
    value: string
  ) => {
    try {
      return await walletTopupRequestService.getOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar solicitação por campo:', err)
      return null
    }
  }

  return {
    walletTopupRequests: walletTopupRequestsResponse?.data ?? [],
    pagination: walletTopupRequestsResponse?.pagination,
    isLoadingWalletTopupRequests: loading,
    error,
    refresh: refetch,

    fetchAllWalletTopupRequestsByField,
    fetchOneWalletTopupByField,

    createWalletTopupRequest,
    updateWalletTopupRequest,
    deleteWalletTopupRequest,
    fetchWalletTopupRequestById,

    dataToExport
  }
}
