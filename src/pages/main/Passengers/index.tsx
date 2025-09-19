import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import swal from 'sweetalert'
import { IoSearchSharp } from 'react-icons/io5'
import { Spinner } from 'phosphor-react'

// Components
import TableRow from '@/components/table/TableRowUser'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import ExportToExcel from '@/components/ExportToExcel'
import { Pagination } from '@/components/Pagination'
import { InputWithButton } from '@/components/input/InputWithButton'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
// import { ModalCreateUser } from './components/modal/ModalCreate'
// import { ModalEditUser } from './components/modal/ModalEdit'

// Data
import { routsNameMain } from '@/constants/routsName'
import { rowPerPageOptions, userStatusOptions } from '@/data/selectOption'

// Interfaces
import type { UserInterface } from '@/interfaces/IUser'

// ViewModel
import { useUsersViewModel } from '@/viewModels/UserViewModel'
import type { UserEntity } from '@/core/entities/User'

export function UserPage() {
  const navigate = useNavigate()

  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')

  const [filters, setFilters] = useState<Partial<UserEntity>>()

  // Paginação
  const [currentPage, setCurrentPage] = useState(0) // página atual (0-based)
  const [docsPerPage, setDocsPerPage] = useState(8) // limite por página

  const { users, pagination, isLoadingUsers, deleteUser, dataToExport } =
    useUsersViewModel(
      docsPerPage,
      currentPage * docsPerPage,
      termForSearch,
      filters
    )

  // Estados para modais
  const [rowSelect, setRowSelect] = useState<UserInterface | null>(null)
  const [modalCreateRowIsOpen, setModalCreateRowIsOpen] = useState(false)
  const [modalEditRowIsOpen, setModalEditRowIsOpen] = useState(false)

  // Consts
  const namePageUppercase = 'Usuários'
  const namePageLowercase = 'usuários'
  const namePageSingular = 'usuário'

  const itemsBreadcrumbs = [
    { label: 'Início', to: routsNameMain.home },
    { label: namePageUppercase, to: routsNameMain.users.passengers.index },
    { label: 'Listagem' }
  ]

  // Navegação
  const handleNavigation = (page: string) => {
    navigate(page)
  }

  // Handle Select
  const handleUserStatusChange = (valueSelected: string) => {
    if (valueSelected === '') {
      setFilters(prev => ({ ...prev, status: undefined })) // limpa filtro
    } else {
      setFilters(prev => ({
        ...prev,
        status: valueSelected as UserEntity['status']
      }))
    }
    setCurrentPage(0) // sempre resetar para página inicial ao filtrar
  }

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  // Abrir modal de edição
  function openModalEditRow(item: UserInterface) {
    setRowSelect(item)
    setModalEditRowIsOpen(true)
  }

  // Abrir página de detalhe
  const openPageViewRow = (id: string) => {
    handleNavigation(`${routsNameMain.users.passengers.viewStr}${id}`)
  }

  // Exclusão com confirmação
  function handleDeleteRow(id: string) {
    swal({
      title: 'Tem certeza?',
      text: 'Uma vez excluído, você não poderá recuperar!',
      buttons: ['Cancelar', 'Confirmar'],
      icon: 'warning',
      dangerMode: true
    }).then(async willDelete => {
      if (willDelete) {
        deleteUser.mutate(id)
      } else {
        swal('O registro está seguro!', { icon: 'error' })
      }
    })
  }

  // Tabela
  const rowsTable = useMemo(
    () =>
      users?.map(item => (
        <TableRow
          key={item.id}
          rowItem={item}
          openModalEditRow={openModalEditRow}
          handleDeleteRow={handleDeleteRow}
          openPageViewRow={openPageViewRow}
        />
      )),
    [users]
  )

  return (
    <div className="w-full h-full flex flex-col gap-6">
      {/* Header */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <div className="w-full flex flex-row justify-between items-center max-w-s-960:flex-col max-w-s-960:items-start gap-2">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            {namePageUppercase}
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
      </div>

      {/* Ações */}
      <div className="w-full grid gap-6 md:grid-cols-5">
        {/* Filtro por status */}
        <SelectSearchableCustom
          name="status"
          label="Status"
          options={userStatusOptions}
          onOptionChange={e => handleUserStatusChange(e as string)}
        />
      </div>
      <div className="w-full flex flex-row justify-between items-end max-w-s-960:flex-col max-w-s-960:items-start gap-2">
        <div className="flex flex-row gap-4 items-center max-w-s-640:flex-col max-w-s-640:items-start">
          <button
            onClick={() => setModalCreateRowIsOpen(true)}
            className="py-2 px-4 rounded-lg bg-primary-200 text-white hover:bg-primary-500 active:bg-primary-700 flex items-center gap-4 transition-all"
          >
            Cadastrar {namePageSingular}
          </button>

          <ExportToExcel
            data={dataToExport}
            filename="users"
            sheetName="Useristradores"
            titlePage="Lista de Useristradores"
            imageSrc="/logo/logo.png"
            orientation="landscape"
            scale={0.8}
          />
        </div>

        <div className="w-full max-w-sm">
          <InputWithButton
            onChange={e => setTermForSearch(e.target.value)}
            placeholder="Pesquisar pelo email..."
            icon={<IoSearchSharp size={20} />}
            onButtonClick={() => setCurrentPage(0)} // resetar página ao buscar
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-6">
        <h1 className="text-xl font-bold text-dark dark:text-light">
          Listagem de {namePageLowercase}
        </h1>

        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-sm font-thin bg-gray-300/40 dark:bg-gray-500/40">
              <tr className="border-b dark:border-gray-700">
                <th className="px-3 py-3 w-[0rem]">Id</th>
                <th className="px-3 py-3 min-w-[18rem]">Usuário</th>
                <th className="px-3 py-3 min-w-[8rem]">Telefone</th>
                <th className="px-3 py-3 min-w-[8rem]">Status</th>
                <th className="px-3 py-3 min-w-[12rem]">Data de Cadastro</th>
                <th className="px-3 py-3 min-w-[8rem]">Ação</th>
              </tr>
            </thead>

            <tbody>
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <Spinner
                      size={28}
                      className="text-primary-200 animate-spin"
                    />
                  </td>
                </tr>
              ) : users?.length ? (
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

          {/* Footer da tabela */}
          <div className="pt-4 flex flex-row max-w-s-960:flex-col justify-between items-center max-w-s-960:items-start gap-1 max-w-s-960:gap-3">
            <p className="text-xs flex flex-row gap-1 whitespace-nowrap">
              Mostrando
              <strong>
                {users?.length ? currentPage * docsPerPage + 1 : 0}
              </strong>
              a
              <strong>
                {currentPage * docsPerPage + (users?.length ?? 0)}
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
      </div>

      {/* {modalCreateRowIsOpen && <ModalCreateUser ... />} */}
      {/* {modalEditRowIsOpen && <ModalEditUser ... />} */}
    </div>
  )
}
