// viewModels/TransactionViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionUseCase } from '@/domain/usecases/transactionUseCase'
import { TransactionEntity } from '@/core/entities/Transaction'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { withAudit } from '@/services/audit.service'

export function useTransactionsViewModel(
  limit?: number,
  offset?: number,
  searchTerm?: string,
  filters?: Partial<TransactionEntity>
) {
  const queryClient = useQueryClient()

  const filtersKey = filters ? JSON.stringify(filters) : ''

  /** Buscar lista de transações */
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
      transactionUseCase.executeGetAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de transações por field */
  const fetchAllTransactionsByField = async (
    field: FieldPath<TransactionEntity>,
    value: any,
    limit?: number,
    offset?: number
  ) => {
    try {
      return await transactionUseCase.executeGetAllByField(field, value, limit, offset)
    } catch (err) {
      console.error('Erro ao buscar transações por campo:', err)
      return null
    }
  }

  /** Criar transação */
  const createTransaction = useMutation({
    mutationFn: (transaction: Omit<TransactionEntity, 'id'>) =>
      withAudit(() => transactionUseCase.executeCreate(transaction), {
        action: 'create',
        module: 'transactions',
        description: `Criou transação de ${transaction.type} no valor de ${transaction.amount}`,
        target_type: 'transaction',
        new_data: transaction
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.transactions.root]
      })
    }
  })

  /** Atualizar transação */
  const updateTransaction = useMutation({
    mutationFn: async ({
      id,
      transaction
    }: {
      id: string
      transaction: Partial<TransactionEntity>
    }) => {
      const previous_data = await transactionUseCase
        .executeGetById(id)
        .catch(() => null)
      return withAudit(() => transactionUseCase.executeUpdate(id, transaction), {
        action: 'update',
        module: 'transactions',
        description: `Atualizou transação - ID: ${id}`,
        target_id: id,
        target_type: 'transaction',
        previous_data: previous_data || undefined,
        new_data: transaction
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.transactions.root]
      })
    }
  })

  /** Deletar transação */
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await transactionUseCase
        .executeGetById(id)
        .catch(() => null)
      return withAudit(() => transactionUseCase.executeDelete(id), {
        action: 'delete',
        module: 'transactions',
        description: `Excluiu transação - ID: ${id}`,
        target_id: id,
        target_type: 'transaction',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.transactions.root]
      })
    }
  })

  /** Buscar transação único (on-demand) */
  const fetchTransactionById = async (id: string) => {
    try {
      return await transactionUseCase.executeGetById(id)
    } catch (err) {
      console.error('Erro ao buscar transação:', err)
      return null
    }
  }

  /** Buscar transaction por field */
  const fetchOneTransactionByField = async (
    field: FieldPath<TransactionEntity>,
    value: string
  ) => {
    try {
      return await transactionUseCase.executeGetOneByField(field, value)
    } catch (err) {
      console.error('Erro ao buscar transação por campo:', err)
      return null
    }
  }

  return {
    transactions: transactionsResponse?.data ?? [],
    pagination: transactionsResponse?.pagination,
    loading,
    error,
    refresh: refetch,

    fetchAllTransactionsByField,
    fetchOneTransactionByField,

    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchTransactionById
  }
}
