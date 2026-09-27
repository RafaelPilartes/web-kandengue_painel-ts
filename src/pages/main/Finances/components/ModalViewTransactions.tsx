import { AppModal } from '@/components/modal/AppModal'
// src/components/modals/ModalViewTransactions.tsx
import { useEffect, useState } from 'react'
import { BeatLoader } from 'react-spinners'

// ViewModel
import { useTransactionsViewModel } from '@/viewModels/TransactionViewModel'

// Styles

// Types
import type { modalViewType } from '@/types/modal'
import { TransactionEntity } from '@/core/entities/Transaction'

// Utils
import { showToast } from '@/utils/toasts'
import type { WalletInterface } from '@/interfaces/IWallet'
import { getTransactionTypeLabel } from '@/utils/gettersLabels'
import { BadgeSimple } from '@/components/badge/BadgeSimple'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { Pagination } from '@/components/Pagination'
import type { paginationType } from '@/interfaces/IApiResponse'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { rowPerPageOptions } from '@/data/selectOption'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'

interface ModalViewTransactionsProps extends modalViewType<WalletInterface> {}

export function ModalViewTransactions({
  modalViewRowIsOpen,
  setModalViewRowIsOpen,
  baseInfo
}: ModalViewTransactionsProps) {
  const { fetchAllTransactionsByField } = useTransactionsViewModel()
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<TransactionEntity[]>([])

  // Paginação
  const [currentPage, setCurrentPage] = useState(0)
  const [docsPerPage, setDocsPerPage] = useState(10)
  const [paginationPage, setPaginationPage] = useState<paginationType>(null)

  const namePageLowercase = 'transação'
  // Modal
  function closeModal() {
    setModalViewRowIsOpen(false)
  }

  async function fetchTransactions() {
    if (!baseInfo?.id) return

    setIsLoading(true)
    try {
      const response = await fetchAllTransactionsByField(
        'wallet_id',
        baseInfo.id,
        20, // limit
        0 // offset
      )

      if (!response) {
        showToast('error', 'Erro ao buscar transações')
      } else {
        setPaginationPage(response.pagination as paginationType)
        setTransactions(response.data as TransactionEntity[])
      }
    } catch (err) {
      const message = mapFirebaseError(err)

      showToast('error', String(message))
    } finally {
      setIsLoading(false)
    }
  }

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  useEffect(() => {
    if (modalViewRowIsOpen) {
      fetchTransactions()
    }
  }, [modalViewRowIsOpen])

  return (
    <AppModal
      variant="drawer"
      size="md"
      isOpen={modalViewRowIsOpen}
      onClose={closeModal}
      title="Transações da Carteira"
    >
          {/* Body */}
          <div className="w-full p-6 max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-row items-center gap-3 text-light">
                <BeatLoader color="white" size={10} />
                <span>Carregando transações...</span>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-light">Nenhuma transação encontrada.</p>
            ) : (
              <div className="w-full flex flex-col gap-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="py-2 px-3">ID</th>
                      <th className="py-2 px-3">Tipo</th>
                      <th className="py-2 px-3">Valor</th>
                      <th className="py-2 px-3">Descrição</th>
                      <th className="py-2 px-3">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(rowItem => (
                      <tr
                        key={rowItem.id}
                        className="border-b border-gray-700 text-gray-200"
                      >
                        <td className="py-2 px-3">{rowItem.id}</td>
                        <td
                          className={`py-2 px-3 font-medium ${
                            rowItem.type === 'credit'
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          <BadgeSimple
                            color={rowItem.type === 'credit' ? 'green' : 'red'}
                            label={getTransactionTypeLabel(rowItem.type)}
                          />
                        </td>
                        <td className="py-2 px-3">{rowItem.amount}</td>
                        <td className="py-2 px-3">{rowItem.description}</td>
                        <td className="py-2 px-3">
                          {
                            formatDateTimeFromFirestore(
                              rowItem.created_at as any
                            ).date
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer */}
                <div className="pt-4 flex flex-row justify-between items-center text-dark dark:text-light">
                  <p className="text-xs flex flex-row gap-1">
                    Mostrando
                    <strong>
                      {transactions?.length ? currentPage * docsPerPage + 1 : 0}
                    </strong>
                    a
                    <strong>
                      {currentPage * docsPerPage + (transactions?.length ?? 0)}
                    </strong>
                    de
                    <strong>{paginationPage?.count ?? 0}</strong>{' '}
                    {namePageLowercase}
                  </p>

                  <div className="flex flex-row justify-center items-center gap-4 mb-3 max-w-s-640:flex-wrap">
                    <div className="flex flex-row max-w-s-640:w-full max-w-s-640:flex-col justify-center items-center gap-4 mb-3 max-w-s-640:flex-wrap">
                      <span className="">Registos por página: </span>

                      <span className="max-w-24">
                        <SelectCustom
                          options={rowPerPageOptions}
                          selectedValue={docsPerPage}
                          onChange={value => handleSelectChange(Number(value))}
                          padding="2"
                        />
                      </span>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalDocs={paginationPage?.count ?? 0}
                      docsPerPage={docsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="w-full py-4 px-5 border-t border-gray-600 flex justify-end">
            <button
              onClick={closeModal}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
            >
              Fechar
            </button>
          </div>
    </AppModal>
  )
}
