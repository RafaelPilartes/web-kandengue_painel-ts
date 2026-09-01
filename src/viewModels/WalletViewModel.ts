// viewModels/WalletViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { walletUseCase } from '@/domain/usecases/walletUseCase'
import { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useMemo } from 'react'

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
    queryFn: () => walletUseCase.executeGetAll(limit, offset, searchTerm, filters),
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
    field: FieldPath<WalletEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await walletUseCase.executeGetAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar carteiras por campo:', err)
      return null
    }
  }

  /** Criar carteira — no servidor, com auditoria dentro da transacção */
  const createWallet = useMutation({
    mutationFn: (input: {
      user_id: string
      user: { id: string; firebase_uid: string; [key: string]: unknown }
      initial_balance: number
      currency: string
      status: string
      reason?: string
    }) => walletUseCase.executeCreateViaApi(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** Activar/desactivar carteira — auditado dentro da transacção da API */
  const setWalletStatus = useMutation({
    mutationFn: ({
      walletId,
      status,
      reason
    }: {
      walletId: string
      status: 'active' | 'inactive'
      reason?: string
    }) => walletUseCase.executeSetStatus(walletId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.wallets.root]
      })
    }
  })

  /** Buscar carteira único (on-demand) */
  const fetchWalletById = async (id: string) => {
    try {
      return await walletUseCase.executeGetById(id)
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
      return await walletUseCase.executeGetOneByField(field, value)
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
    setWalletStatus,
    fetchWalletById,

    dataToExport
  }
}
