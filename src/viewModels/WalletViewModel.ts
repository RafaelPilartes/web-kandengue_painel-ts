import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WalletService } from '@/services/wallet.service'
import { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const walletService = new WalletService()

export function useWalletsViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de wallets */
  const {
    data: walletsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<WalletEntity[]>>({
    queryKey: ['wallets', limit, offset],
    queryFn: () => walletService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de wallets por field */
  const fetchAllWalletSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await walletService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar wallets por campo:', err)
      return null
    }
  }

  /** 🔹 Criar wallet */
  const createWallet = useMutation({
    mutationFn: (wallet: Omit<WalletEntity, 'id'>) =>
      walletService.create(wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    }
  })

  /** 🔹 Atualizar wallet */
  const updateWallet = useMutation({
    mutationFn: ({
      id,
      wallet
    }: {
      id: string
      wallet: Partial<WalletEntity>
    }) => walletService.update(id, wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    }
  })

  /** 🔹 Deletar wallet */
  const deleteWallet = useMutation({
    mutationFn: (id: string) => walletService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    }
  })

  /** 🔹 Buscar wallet único (on-demand) */
  const fetchWalletById = async (id: string) => {
    try {
      return await walletService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar wallet:', err)
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
