// src/pages/NotificationsPage.tsx
import { useMemo, useState } from 'react'
// import { IoSearchSharp } from 'react-icons/io5'
import { Spinner } from 'phosphor-react'
import swal from 'sweetalert'

// Components
import { Breadcrumbs } from '@/components/Breadcrumbs'
// import { InputWithButton } from '@/components/input/InputWithButton'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { Pagination } from '@/components/Pagination'
import { ModalSendNotification } from './components/ModalSendNotification'

// ViewModel
import { useNotificationsViewModel } from '@/viewModels/NotificationViewModel'

// Types & Interfaces
import type { NotificationInterface } from '@/interfaces/INotification'
import {
  notificationTypeOptions,
  notificationCategoryOptions,
  rowPerPageOptions
} from '@/data/selectOption'
import TableRow from '@/components/table/TableRowNotification'
import { SelectCustom } from '@/components/selects/SelectCustom'

export function NotificationsPage() {
  const [
    termForSearch
    // setTermForSearch
  ] = useState<string>('')

  // Filtros e Paginação
  const [filters, setFilters] = useState<Partial<NotificationInterface>>()
  const [currentPage, setCurrentPage] = useState(0)
  const [docsPerPage, setDocsPerPage] = useState(10)

  const {
    notifications,
    pagination,
    isLoadingNotifications,
    deleteNotification
  } = useNotificationsViewModel(
    docsPerPage,
    currentPage * docsPerPage,
    termForSearch,
    filters
  )

  // Modal de Envio de Notificação
  const [modalSendNotificationIsOpen, setModalSendNotificationIsOpen] =
    useState(false)

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  // Excluir Notificação
  function handleDeleteNotification(id: string) {
    swal({
      title: 'Tem certeza?',
      text: 'Essa notificação será removida permanentemente!',
      buttons: ['Cancelar', 'Confirmar'],
      icon: 'warning',
      dangerMode: true
    }).then(async willDelete => {
      if (willDelete) {
        try {
          await deleteNotification.mutateAsync(id)

          swal('Notificação excluída com sucesso!', {
            icon: 'success'
          })
        } catch (error) {
          swal('Erro ao excluir notificação', {
            text: `Houve um erro: ${String(error)}`,
            icon: 'error'
          })
        }
      } else {
        swal('A notificação foi preservada!', { icon: 'error' })
      }
    })
  }

  // Rows da tabela
  const rowsTable = useMemo(
    () =>
      notifications?.map(item => (
        <TableRow
          key={item.id}
          rowItem={item}
          handleDeleteRow={handleDeleteNotification}
        />
      )),
    [notifications]
  )

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Header */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Envio de Notificações
          </h1>
          <Breadcrumbs
            items={[
              { label: 'Início', to: '/' },
              { label: 'Notificações', to: '/notifications' },
              { label: 'Envio' }
            ]}
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="w-full grid gap-6 md:grid-cols-5">
        <SelectSearchableCustom
          name="type"
          label="Tipo"
          options={notificationTypeOptions}
          onOptionChange={e =>
            setFilters(prev => ({
              ...prev,
              type: e as NotificationInterface['type']
            }))
          }
        />
        <SelectSearchableCustom
          name="category"
          label="Categoria"
          options={notificationCategoryOptions}
          onOptionChange={e => {
            setFilters(prev => ({
              ...prev,
              category: e as NotificationInterface['category']
            }))
          }}
        />
      </div>

      {/* Ações */}
      <div className="w-full flex flex-row justify-between items-end max-w-s-960:flex-col max-w-s-960:items-start gap-2">
        <button
          onClick={() => setModalSendNotificationIsOpen(true)}
          className="py-2 px-4 rounded-lg bg-primary-200 text-white hover:bg-primary-500 active:bg-primary-700 flex items-center gap-4 transition-all"
        >
          Enviar Notificação
        </button>
      </div>

      {/* Tabela de Notificações */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <h1 className="text-xl font-bold text-dark dark:text-light">
          Lista de Notificações
        </h1>

        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-sm font-thin bg-gray-300/40 dark:bg-gray-500/40">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Título</th>
                <th className="px-3 py-3">Mensagem</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Categoria</th>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingNotifications ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    <Spinner
                      size={28}
                      className="text-primary-200 animate-spin"
                    />
                  </td>
                </tr>
              ) : notifications?.length ? (
                rowsTable
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    Nenhuma notificação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginação */}
        <div className="pt-4 flex flex-row justify-between items-center">
          <p className="text-xs flex flex-row gap-1">
            Mostrando
            <strong>
              {notifications?.length ? currentPage * docsPerPage + 1 : 0}
            </strong>
            a
            <strong>
              {currentPage * docsPerPage + (notifications?.length ?? 0)}
            </strong>
            de
            <strong>{pagination?.count ?? 0}</strong> notificações
          </p>

          <div className="flex flex-row justify-center items-center gap-4 mb-3 max-w-s-640:flex-wrap">
            <div className="flex-1 flex flex-row justify-start items-center gap-4 max-w-s-520:flex-wrap">
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

      {/* Modal de Envio de Notificação */}
      {modalSendNotificationIsOpen && (
        <ModalSendNotification
          isOpen={modalSendNotificationIsOpen}
          setIsOpen={setModalSendNotificationIsOpen}
        />
      )}
    </div>
  )
}
