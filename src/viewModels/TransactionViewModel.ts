// viewModels/TransactionViewModel.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TransactionService } from '@/routes/services/transaction.service'
import { TransactionEntity } from '@/core/entities/Transaction'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { WalletService } from '@/routes/services/wallet.service'
import type { TransactionType, TransactionCategoryType } from '@/types/enum'
import { withAudit } from '@/routes/services/audit.service'

const transactionService = new TransactionService()
const walletService = new WalletService()

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
      transactionService.getAll(limit, offset, searchTerm, filters),
    staleTime: 1000 * 60 // cache 1min
  })

  /** Buscar lista de transações por field */
  const fetchAllTransactionsByField = async (
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

  /** Criar transação */
  const createTransaction = useMutation({
    mutationFn: (transaction: Omit<TransactionEntity, 'id'>) =>
      withAudit(() => transactionService.create(transaction), {
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
      const previous_data = await transactionService
        .getById(id)
        .catch(() => null)
      return withAudit(() => transactionService.update(id, transaction), {
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
      const previous_data = await transactionService
        .getById(id)
        .catch(() => null)
      return withAudit(() => transactionService.delete(id), {
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
      return await transactionService.getById(id)
    } catch (err) {
      console.error('Erro ao buscar transação:', err)
      return null
    }
  }

  /** Função composta: atualizar saldo + registrar transação */
  const updateBalanceAndAddTransaction = useMutation({
    mutationFn: async ({
      walletId,
      amount,
      type,
      category,
      description
    }: {
      walletId: string
      amount: number
      type: TransactionType
      category: TransactionCategoryType
      description?: string
    }) => {
      return withAudit(
        async () => {
          // 1. Buscar carteira atual
          const wallet = await walletService.getById(walletId)
          if (!wallet) throw new Error('Transação não encontrada')

          // 2. Calcular novo saldo
          const newBalance =
            type === 'credit'
              ? wallet.balance + amount
              : wallet.balance - amount

          // 3. Atualiza saldo da carteira
          const updatedWallet = await walletService.update(walletId, {
            balance: newBalance
          })

          // 4. Cria a transação correspondente
          const transaction: Omit<TransactionEntity, 'id'> = {
            wallet_id: walletId,
            user_id: (wallet as any).user?.id ?? walletId,
            amount,
            type,
            category,
            status: 'success',
            description: description ?? ''
          }

          const createdTransaction =
            await transactionService.create(transaction)

          return { updatedWallet, createdTransaction }
        },
        {
          action: 'create',
          module: 'transactions',
          description: `Criou transação ${type} de ${amount} para a carteira ${walletId}`,
          target_id: walletId,
          target_type: 'wallet'
        }
      )
    }
  })

  /** Buscar transaction por field */
  const fetchOneTransactionByField = async (
    field: keyof TransactionEntity,
    value: string
  ) => {
    try {
      return await transactionService.getOneByField(field, value)
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
    fetchTransactionById,

    updateBalanceAndAddTransaction
  }
}
