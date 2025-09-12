// viewModels/TransactionViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TransactionService } from '@/services/transaction.service'
import { TransactionEntity } from '@/core/entities/Transaction'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'

const transactionService = new TransactionService()

export function useTransactionsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<TransactionEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** 🔹 Buscar lista de transações */
  const {
    data: transactionsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<TransactionEntity[]>>({
    queryKey: [
      firebaseCollections.transactions.root,
      limit,
      offset,
      searchTerm,
      filtersKey
    ],
    queryFn: () =>
      transactionService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de transações por field */
  const fetchAllTransactionSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await transactionService.getAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar transações por campo:', err)
      return null
    }
  }

  /** 🔹 Criar transação */
  const createTransaction = useMutation({
    mutationFn: (transaction: Omit<TransactionEntity, 'id'>) =>
      transactionService.create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.transactions.root]
      })
    }
  })

  /** 🔹 Atualizar transação */
  const updateTransaction = useMutation({
    mutationFn: ({
      id,
      transaction
    }: {
      id: string
      transaction: Partial<TransactionEntity>
    }) => transactionService.update(id, transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.transactions.root]
      })
    }
  })

  /** 🔹 Deletar transação */
  const deleteTransaction = useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.transactions.root]
      })
    }
  })

  /** 🔹 Buscar transação único (on-demand) */
  const fetchTransactionById = async (id: string) => {
    try {
      return await transactionService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar transação:', err)
      return null
    }
  }

  return {
    transactions: transactionsResponse?.data ?? [],
    pagination: transactionsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllTransactionSByField,

    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactionById
  }
}
