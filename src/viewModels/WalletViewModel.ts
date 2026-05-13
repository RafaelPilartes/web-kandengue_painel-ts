// viewModels/WalletViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WalletService } from '@/routes/services/wallet.service'
import { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo } from 'react'
import { withAudit } from '@/routes/services/audit.service'

const walletService = new WalletService()

export function useWalletsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<WalletEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de Carteiras */
  const {
    data: walletsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<WalletEntity[]>>({
    queryKey: [
      firebaseCollections.wallets.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () => walletService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  // transforma os dados em formato exportável
  const dataToExport = useMemo(() => {
    if (!walletsResponse?.data) return []
    return walletsResponse?.data.map(doc => ({
      Id: doc.id,
      Nome: doc.user.name,
      Email: doc.user.email,
      Telefone: doc.user.phone,
      'Data de criação': doc.created_at,
      'Última atualização': doc.updated_at
    }))
  }, [walletsResponse?.data])

  /** Buscar lista de Carteiras por field */
  const fetchAllWalletsByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await walletService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar carteiras por campo:', err)
      return null
    }
  }

  /** Criar carteira */
  const createWallet = useMutation({
    mutationFn: async (wallet: Omit<WalletEntity, 'id'>) =>
      withAudit(() => walletService.create(wallet), {
        action: 'create',
        module: 'wallet',
        description: `Criou carteira para o usuário: ${wallet.user?.name}`,
        target_type: 'wallet',
        new_data: wallet
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** Atualizar carteira */
  const updateWallet = useMutation({
    mutationFn: async ({
      id,
      wallet
    }: {
      id: string
      wallet: Partial<WalletEntity>
    }) => {
      const previous_data = await walletService.getById(id).catch(() => null)
      return withAudit(() => walletService.update(id, wallet), {
        action: 'update',
        module: 'wallet',
        description: `Atualizou carteira - ID: ${id}`,
        target_id: id,
        target_type: 'wallet',
        previous_data: previous_data || undefined,
        new_data: wallet
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** Deletar carteira */
  const deleteWallet = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await walletService.getById(id).catch(() => null)
      return withAudit(() => walletService.delete(id), {
        action: 'delete',
        module: 'wallet',
        description: `Excluiu carteira - ID: ${id}`,
        target_id: id,
        target_type: 'wallet',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** Buscar carteira único (on-demand) */
  const fetchWalletById = async (id: string) => {
    try {
      return await walletService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar carteira:', err)
      return null
    }
  }

  /** Buscar wallet por field */
  const fetchOneWalletByField = async (
    field: keyof WalletEntity,
    value: string
  ) => {
    try {
      return await walletService.getOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar carteira por campo:', err)
      return null
    }
  }

  return {
    wallets: walletsResponse?.data ?? [],
    pagination: walletsResponse?.pagination,
    isLoadingWallets: loading,
    error,
    refresh: refetch,

    fetchAllWalletsByField,
    fetchOneWalletByField,

    createWallet,
    updateWallet,
    deleteWallet,
    fetchWalletById,

    dataToExport
  }
}
