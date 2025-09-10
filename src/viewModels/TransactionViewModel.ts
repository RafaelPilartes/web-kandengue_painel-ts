import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TransactionService } from '@/services/transaction.service'
import { TransactionEntity } from '@/core/entities/Transaction'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const transactionService = new TransactionService()

export function useTransactionsViewModel(limit?: number, offset?: number) {
  const queryClient = useQueryClient()

  /** 🔹 Buscar lista de transactions */
  const {
    data: transactionsResponse,
    isLoading: loading,
    error,
    refetch
  } = useQuery<ListResponseType<TransactionEntity[]>>({
    queryKey: ['transactions', limit, offset],
    queryFn: () => transactionService.getAll(limit, offset),
    staleTime: 1000 * 60 // cache 1min
  })

  /** 🔹 Buscar lista de transactions por field */
  const fetchAllTransactionSByField = async (
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      const response = await transactionService.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return response
    } catch (err) {
      console.error('Erro ao buscar transactions por campo:', err)
      return null
    }
  }

  /** 🔹 Criar transaction */
  const createTransaction = useMutation({
    mutationFn: (transaction: Omit<TransactionEntity, 'id'>) =>
      transactionService.create(transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  /** 🔹 Atualizar transaction */
  const updateTransaction = useMutation({
    mutationFn: ({
      id,
      transaction
    }: {
      id: string
      transaction: Partial<TransactionEntity>
    }) => transactionService.update(id, transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  /** 🔹 Deletar transaction */
  const deleteTransaction = useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })

  /** 🔹 Buscar transaction único (on-demand) */
  const fetchTransactionById = async (id: string) => {
    try {
      return await transactionService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar transaction:', err)
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
