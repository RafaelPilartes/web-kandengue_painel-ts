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
import type { WalletEntity } from '@/core/entities/Wallet'
import TableRow from '../../../components/table/TableRowWallet'

// ViewModel (simulação, depois ligamos com API)
import { useWalletsViewModel } from '@/viewModels/WalletViewModel'
import { ModalViewTransactions } from './components/ModalViewTransactions'
import type { WalletInterface } from '@/interfaces/IWallet'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { rowPerPageOptions } from '@/data/selectOption'
import { ModalCreateWallet } from './components/ModalCreate'
import { ModalViewWallet } from './components/ModalView'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'

export function WalletsPage() {
  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')
  const [filters, setFilters] = useState<Partial<WalletEntity>>()

  // Paginação
  const [currentPage, setCurrentPage] = useState(0)
  const [docsPerPage, setDocsPerPage] = useState(10)

  const [modalViewTransactionsIsOpen, setModalViewTransactionsIsOpen] =
    useState<boolean>(false)
  const [modalViewWalletIsOpen, setModalViewWalletIsOpen] =
    useState<boolean>(false)

  const { wallets, pagination, isLoadingWallets, deleteWallet, dataToExport } =
    useWalletsViewModel(
      docsPerPage,
      currentPage * docsPerPage,
      termForSearch,
      filters
    )

  // Estados para modais
  const [rowSelect, setRowSelect] = useState<WalletInterface | null>(null)
  const [modalCreateRowIsOpen, setModalCreateRowIsOpen] = useState(false)
  // const [modalEditRowIsOpen, setModalEditRowIsOpen] = useState(false)

  // Consts
  const namePageUppercase = 'Carteira & Transações'
  const namePageLowercase = 'carteiras'
  const namePageSingular = 'carteira'

  const itemsBreadcrumbs = [
    { label: 'Início', to: '/' },
    { label: namePageUppercase, to: '/wallet' },
    { label: 'Listagem' }
  ]

  // Rows da tabela
  const rowsTable = useMemo(
    () =>
      wallets?.map(item => (
        <TableRow
          key={item.id}
          rowItem={item}
          openPageViewTransactionsRow={openModalViewTransactionsRow}
          openPageViewWalletRow={openModalViewWalletRow}
          handleDeleteRow={handleDeleteRow}
        />
      )),
    [wallets]
  )

  // Excluir
  function handleDeleteRow(id: string) {
    swal({
      title: 'Tem certeza?',
      text: 'Uma vez excluído, não poderá recuperar!',
      buttons: ['Cancelar', 'Confirmar'],
      icon: 'warning',
      dangerMode: true
    }).then(async willDelete => {
      if (willDelete) {
        try {
          await deleteWallet.mutateAsync(id)

          swal('Aprovado com sucesso', {
            title: 'Carteira Removida com sucesso',
            icon: 'success'
          })
        } catch (error) {
          const message = mapFirebaseError(error)

          swal('Erro ao aprovar', {
            text: `Houve algum erro durante o processo, ${String(message)}`,
            icon: 'error'
          })
        }
      } else {
        swal('O registro está seguro!', { icon: 'error' })
      }
    })
  }

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  // openModalEditRow
  function openModalViewTransactionsRow(item: WalletInterface) {
    setRowSelect(item)
    setModalViewTransactionsIsOpen(true)
  }

  // openModalEditRow
  function openModalViewWalletRow(item: WalletInterface) {
    setRowSelect(item)
    setModalViewWalletIsOpen(true)
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
            { value: 'active', label: 'Ativo' },
            { value: 'blocked', label: 'Bloqueado' }
          ]}
          onOptionChange={e =>
            setFilters(prev => ({
              ...prev,
              status: e as WalletEntity['status']
            }))
          }
        />
      </div>

      {/* Ações */}
      <div className="w-full flex flex-row justify-between items-end max-w-s-960:flex-col max-w-s-960:items-start gap-2">
        <div className="flex flex-row gap-4 items-center max-w-s-640:flex-col max-w-s-640:items-start">
          <button
            onClick={() => setModalCreateRowIsOpen(true)}
            className="py-2 px-4 rounded-lg bg-primary-200 text-white hover:bg-primary-500 active:bg-primary-700 flex items-center gap-4 transition-all"
          >
            Adicionar {namePageSingular}
          </button>

          <ExportToExcel
            data={dataToExport}
            filename="wallets"
            sheetName="Carteiras"
            titlePage="Lista de Carteiras e Transações"
            imageSrc="/logo/logo.png"
            orientation="landscape"
            scale={0.8}
          />
        </div>

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
          Lista de Motoristas & Saldos
        </h1>

        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-sm font-thin bg-gray-300/40 dark:bg-gray-500/40">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Motorista</th>
                <th className="px-3 py-3">Telefone</th>
                <th className="px-3 py-3">Saldo Atual</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingWallets ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <Spinner
                      size={28}
                      className="text-primary-200 animate-spin"
                    />
                  </td>
                </tr>
              ) : wallets?.length ? (
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
              {wallets?.length ? currentPage * docsPerPage + 1 : 0}
            </strong>
            a
            <strong>
              {currentPage * docsPerPage + (wallets?.length ?? 0)}
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

      {modalCreateRowIsOpen && (
        <ModalCreateWallet
          modalCreateRowIsOpen={modalCreateRowIsOpen}
          setModalCreateRowIsOpen={setModalCreateRowIsOpen}
        />
      )}

      {modalViewTransactionsIsOpen && rowSelect && (
        <ModalViewTransactions
          modalViewRowIsOpen={modalViewTransactionsIsOpen}
          setModalViewRowIsOpen={setModalViewTransactionsIsOpen}
          baseInfo={rowSelect}
        />
      )}

      {modalViewWalletIsOpen && rowSelect && (
        <ModalViewWallet
          modalViewRowIsOpen={modalViewWalletIsOpen}
          setModalViewRowIsOpen={setModalViewWalletIsOpen}
          baseInfo={rowSelect}
        />
      )}
    </div>
  )
}
