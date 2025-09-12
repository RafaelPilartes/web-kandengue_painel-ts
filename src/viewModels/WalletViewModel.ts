// viewModels/WalletViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WalletService } from '@/services/wallet.service'
import { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const walletService = new WalletService()

export function useWalletsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<WalletEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de Carteiras */
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

  /** 🔹 Buscar lista de Carteiras por field */
  const fetchAllWalletSByField = async (
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

  /** 🔹 Criar carteira */
  const createWallet = useMutation({
    mutationFn: (wallet: Omit<WalletEntity, 'id'>) =>
      walletService.create(wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** 🔹 Atualizar carteira */
  const updateWallet = useMutation({
    mutationFn: ({
      id,
      wallet
    }: {
      id: string
      wallet: Partial<WalletEntity>
    }) => walletService.update(id, wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** 🔹 Deletar carteira */
  const deleteWallet = useMutation({
    mutationFn: (id: string) => walletService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** 🔹 Buscar carteira único (on-demand) */
  const fetchWalletById = async (id: string) => {
    try {
      return await walletService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar carteira:', err)
      return null
    }
  }

  return {
    wallets: walletsResponse?.data ?? [],
    pagination: walletsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllWalletSByField,

    createWallet,
    updateWallet,
    deleteWallet,
    fetchWalletById
  }
}
