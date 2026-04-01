import { useState, useMemo } from 'react'
import { IoSearchSharp } from 'react-icons/io5'
import { Spinner } from 'phosphor-react'
import swal from 'sweetalert'

// Components
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { InputWithButton } from '@/components/input/InputWithButton'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import ExportToExcel from '@/components/ExportToExcel'
import { Pagination } from '@/components/Pagination'

// Interfaces
import TableRow from '../../../components/table/TableRowWalletTopupRequest'

// ViewModel (simulação, depois ligamos com API)
import { useWalletTopupRequestsViewModel } from '@/viewModels/WalletTopupRequestViewModel'
import type { WalletTopupStatus } from '@/types/enum'
import { useTransactionsViewModel } from '@/viewModels/TransactionViewModel'
import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import { useAdminStore } from '@/stores/userStore'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { rowPerPageOptions } from '@/data/selectOption'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'
import { ModalViewTopupRequest } from './components/ModalViewTopupRequest'

export function WalletTopupRequestsPage() {
  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')
  const [filters, setFilters] = useState<Partial<WalletTopupRequestInterface>>()

  // Paginação
  const [currentPage, setCurrentPage] = useState(0)
  const [docsPerPage, setDocsPerPage] = useState(10)

  // Estados para modais
  const [rowSelect, setRowSelect] =
    useState<WalletTopupRequestInterface | null>(null)
  const [modalViewTopupRequestIsOpen, setModalViewTopupRequestIsOpen] =
    useState<boolean>(false)

  const { currentAdminData } = useAdminStore()

  const {
    walletTopupRequests,
    pagination,
    isLoadingWalletTopupRequests,
    updateWalletTopupRequest,
    dataToExport
  } = useWalletTopupRequestsViewModel(
    docsPerPage,
    currentPage * docsPerPage,
    termForSearch,
    filters
  )

  const { updateBalanceAndAddTransaction } = useTransactionsViewModel()

  // Consts
  const namePageUppercase = 'Solicitação de Recarga'
  const namePageLowercase = 'solicitações'

  const itemsBreadcrumbs = [
    { label: 'Início', to: '/' },
    { label: namePageUppercase, to: '/walletTopupRequest' },
    { label: 'Listagem' }
  ]

  // Excluir (se for preciso remover carteira ou transação)
  function handleAction(
    docId: string,
    status: WalletTopupStatus,
    item?: WalletTopupRequestInterface
  ) {
    if (status === 'approved') {
      swal({
        title: 'Tem certeza?',
        text: 'Uma vez aprovado, não poderá reverter!',
        buttons: ['Cancelar', 'Confirmar'],
        icon: 'warning',
        dangerMode: true
      }).then(async willApprove => {
        if (willApprove) {
          try {
            await updateWalletTopupRequest.mutateAsync({
              id: docId,
              walletTopupRequest: {
                status: 'approved',
                reviewed_by: currentAdminData?.id ?? null
              }
            })

            if (item) {
              await updateBalanceAndAddTransaction.mutateAsync({
                walletId: item?.wallet_id,
                amount: item?.amount,
                type: 'credit',
                category: 'wallet_topup',
                description: 'Carregamento manual aprovado'
              })
            }

            swal('Aprovado com sucesso', {
              icon: 'success'
            })
          } catch (error) {
            swal('Erro ao aprovar', {
              text: 'Houve algum erro durante a aprovação...',
              icon: 'error'
            })
          }
        } else {
          swal('Nenhuma operação foi realizada!', { icon: 'error' })
        }
      })
    }

    if (status === 'rejected') {
      swal({
        title: 'Tem certeza?',
        text: 'Uma vez rejeitar, não poderá reverter!',
        content: {
          element: 'textarea',
          attributes: {
            placeholder: 'Motivo da rejeição...',
            rows: 4,
            id: 'rejection-reason' // ID para o textarea
          }
        },
        buttons: ['Cancelar', 'Confirmar'],
        icon: 'warning',
        dangerMode: true
      }).then(async willApprove => {
        if (willApprove) {
          // Capturar o valor do textarea manualmente
          const textarea = document.getElementById(
            'rejection-reason'
          ) as HTMLTextAreaElement
          const rejectionReason = textarea?.value.trim()

          // Validar se o motivo foi preenchido
          if (!rejectionReason) {
            swal('Erro!', 'Por favor, informe o motivo da rejeição.', 'error')
            return
          }

          // alert(`Motivo: ${rejectionReason}`)

          try {
            await updateWalletTopupRequest.mutateAsync({
              id: docId,
              walletTopupRequest: {
                status: 'rejected',
                rejected_reason: rejectionReason,
                reviewed_by: currentAdminData?.id ?? null
              }
            })

            swal('Rejeitado com sucesso', {
              icon: 'success'
            })
          } catch (error) {
            const message = mapFirebaseError(error)

            swal('Erro ao rejeitar', {
              text: `Houve algum erro durante a rejeição, ${String(message)}`,
              icon: 'error'
            })
          }
        } else {
          swal('Nenhuma operação foi realizada!', { icon: 'error' })
        }
      })
    }
  }

  // Rows da tabela
  const rowsTable = useMemo(
    () =>
      walletTopupRequests?.map(item => (
        <TableRow
          key={item.id}
          rowItem={item}
          openPageViewRow={openModalViewTopupRequestRow}
          handleApprove={handleAction}
          handleReject={handleAction}
        />
      )),
    [walletTopupRequests]
  )

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  // openModalViewRow
  function openModalViewTopupRequestRow(item: WalletTopupRequestInterface) {
    setRowSelect(item)
    setModalViewTopupRequestIsOpen(true)
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Header */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            {namePageUppercase}
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
      </div>

      {/* Filtros */}
      <div className="w-full grid gap-6 md:grid-cols-5">
        <SelectSearchableCustom
          name="status"
          label="Status"
          options={[
            { value: '', label: 'Todos' },
            { value: 'pending', label: 'Pendente' },
            { value: 'approved', label: 'Aprovado' },
            { value: 'rejected', label: 'Rejeitado' }
          ]}
          onOptionChange={e =>
            setFilters(prev => ({
              ...prev,
              status: e as WalletTopupRequestInterface['status']
            }))
          }
        />
      </div>

      {/* Ações */}
      <div className="w-full flex flex-row justify-between items-end">
        <ExportToExcel
          data={dataToExport}
          filename="walletTopupRequests"
          sheetName="Carteiras"
          titlePage="Lista de Carteiras e Transações"
          imageSrc="/logo/logo.png"
          orientation="landscape"
          scale={0.8}
        />

        <div className="w-full max-w-sm">
          <InputWithButton
            onChange={e => setTermForSearch(e.target.value)}
            placeholder="Pesquisar motorista..."
            icon={<IoSearchSharp size={20} />}
            onButtonClick={() => setCurrentPage(0)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <h1 className="text-xl font-bold text-dark dark:text-light">
          Lista de {namePageLowercase}
        </h1>

        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-sm font-thin bg-gray-300/40 dark:bg-gray-500/40">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Carteira</th>
                <th className="px-3 py-3">Valor</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Metodo</th>
                <th className="px-3 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingWalletTopupRequests ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <Spinner
                      size={28}
                      className="text-primary-200 animate-spin"
                    />
                  </td>
                </tr>
              ) : walletTopupRequests?.length ? (
                rowsTable
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-4 flex flex-row justify-between items-center">
          <p className="text-xs flex flex-row gap-1">
            Mostrando
            <strong>
              {walletTopupRequests?.length ? currentPage * docsPerPage + 1 : 0}
            </strong>
            a
            <strong>
              {currentPage * docsPerPage + (walletTopupRequests?.length ?? 0)}
            </strong>
            de
            <strong>{pagination?.count ?? 0}</strong> {namePageLowercase}
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
              totalDocs={pagination?.count ?? 0}
              docsPerPage={docsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {modalViewTopupRequestIsOpen && rowSelect && (
        <ModalViewTopupRequest
          modalViewRowIsOpen={modalViewTopupRequestIsOpen}
          setModalViewRowIsOpen={setModalViewTopupRequestIsOpen}
          baseInfo={rowSelect}
        />
      )}
    </div>
  )
}
