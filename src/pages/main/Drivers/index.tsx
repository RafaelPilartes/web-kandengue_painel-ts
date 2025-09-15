import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import swal from 'sweetalert'
import { IoSearchSharp } from 'react-icons/io5'
import { Spinner } from 'phosphor-react'

// Components
import TableRow from '@/components/table/TableRowDriver'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import ExportToExcel from '@/components/ExportToExcel'
import { Pagination } from '@/components/Pagination'
import { InputWithButton } from '@/components/input/InputWithButton'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
// import { ModalCreateDriver } from './components/modal/ModalCreate'
// import { ModalEditDriver } from './components/modal/ModalEdit'

// Data
import { routsNameMain } from '@/constants/routsName'
import { isOnlineOptions, rowPerPageOptions } from '@/data/selectOption'

// Interfaces
import type { DriverInterface } from '@/interfaces/IDriver'

// ViewModel
import { useDriversViewModel } from '@/viewModels/DriverViewModel'
import type { DriverEntity } from '@/core/entities/Driver'

export function DriverPage() {
  const navigate = useNavigate()

  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')
  // filters?: Partial<DriverEntity>
  const [filters, setFilters] = useState<Partial<DriverEntity>>()

  // Paginação
  const [currentPage, setCurrentPage] = useState(0) // página atual (0-based)
  const [docsPerPage, setDocsPerPage] = useState(8) // limite por página

  const { drivers, pagination, isLoadingDrivers, deleteDriver, dataToExport } =
    useDriversViewModel(
      docsPerPage,
      currentPage * docsPerPage,
      termForSearch,
      filters
    )

  // Estados para modais
  const [rowSelect, setRowSelect] = useState<DriverInterface | null>(null)
  const [modalCreateRowIsOpen, setModalCreateRowIsOpen] = useState(false)
  const [modalEditRowIsOpen, setModalEditRowIsOpen] = useState(false)

  // Consts
  const namePageUppercase = 'Motoristas'
  const namePageLowercase = 'motoristas'
  const namePageSingular = 'motorista'

  const itemsBreadcrumbs = [
    { label: 'Início', to: routsNameMain.home },
    { label: namePageUppercase, to: routsNameMain.users.drivers.index },
    { label: 'Listagem' }
  ]

  // Navegação
  const handleNavigation = (page: string) => {
    navigate(page)
  }

  // Handle Select
  const handleDriverIsOnlineChange = (valueSelected: string) => {
    if (valueSelected === '') {
      setFilters(prev => ({ ...prev, is_online: undefined })) // limpa filtro
    } else {
      setFilters(prev => ({
        ...prev,
        is_online: valueSelected === 'true'
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
  function openModalEditRow(item: DriverInterface) {
    setRowSelect(item)
    setModalEditRowIsOpen(true)
  }

  // Abrir página de detalhe
  const openPageViewRow = (id: string) => {
    handleNavigation(`${routsNameMain.users.drivers.viewStr}${id}`)
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
        deleteDriver.mutate(id)
      } else {
        swal('O registro está seguro!', { icon: 'error' })
      }
    })
  }

  // Tabela
  const rowsTable = useMemo(
    () =>
      drivers?.map(item => (
        <TableRow
          key={item.id}
          rowItem={item}
          openModalEditRow={openModalEditRow}
          handleDeleteRow={handleDeleteRow}
          openPageViewRow={openPageViewRow}
        />
      )),
    [drivers]
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
        {/* Filtro por role */}
        <SelectSearchableCustom
          name="is_online"
          label=""
          options={isOnlineOptions}
          onOptionChange={e => handleDriverIsOnlineChange(e as string)}
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
            filename="drivers"
            sheetName="Driveristradores"
            titlePage="Lista de Driveristradores"
            imageSrc="/logo/logo.png"
            orientation="landscape"
            scale={0.8}
          />
        </div>

        <div className="w-full max-w-sm">
          <InputWithButton
            onChange={e => setTermForSearch(e.target.value)}
            placeholder="Pesquisar..."
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
                <th className="px-3 py-3 min-w-[8rem]">Atividade</th>
                <th className="px-3 py-3 min-w-[8rem]">Status</th>
                <th className="px-3 py-3 min-w-[12rem]">Data de Cadastro</th>
                <th className="px-3 py-3 min-w-[8rem]">Ação</th>
              </tr>
            </thead>

            <tbody>
              {isLoadingDrivers ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <Spinner
                      size={28}
                      className="text-primary-200 animate-spin"
                    />
                  </td>
                </tr>
              ) : drivers?.length ? (
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
                {drivers?.length ? currentPage * docsPerPage + 1 : 0}
              </strong>
              a
              <strong>
                {currentPage * docsPerPage + (drivers?.length ?? 0)}
              </strong>
              de
              <strong>{pagination?.count ?? 0}</strong> {namePageLowercase}
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
      </div>

      {/* {modalCreateRowIsOpen && <ModalCreateDriver ... />} */}
      {/* {modalEditRowIsOpen && <ModalEditDriver ... />} */}
    </div>
  )
}
