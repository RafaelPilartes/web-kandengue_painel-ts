import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import swal from 'sweetalert'
import { IoSearchSharp } from 'react-icons/io5'
import { Spinner } from 'phosphor-react'

// Components
import TableRow from '@/components/table/TableRowRide'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import ExportToExcel from '@/components/ExportToExcel'
import { Pagination } from '@/components/Pagination'
import { InputWithButton } from '@/components/input/InputWithButton'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
// import { ModalCreateRide } from './components/modal/ModalCreate'
// import { ModalEditRide } from './components/modal/ModalEdit'

// Data
import { routsNameMain } from '@/constants/routsName'
import { rowPerPageOptions, rideStatusOptions } from '@/data/selectOption'

// Interfaces
import type { RideInterface } from '@/interfaces/IRide'

// ViewModel
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import type { RideEntity } from '@/core/entities/Ride'

export function RidesPage() {
  const navigate = useNavigate()

  // Filtros
  const [termForSearch, setTermForSearch] = useState<string>('')

  const [filters, setFilters] = useState<Partial<RideEntity>>()

  // Paginação
  const [currentPage, setCurrentPage] = useState(0) // página atual (0-based)
  const [docsPerPage, setDocsPerPage] = useState(8) // limite por página

  const { rides, pagination, isLoadingRides, deleteRide, dataToExport } =
    useRidesViewModel(
      docsPerPage,
      currentPage * docsPerPage,
      termForSearch,
      filters
    )

  // Estados para modais
  // const [rowSelect, setRowSelect] = useState<RideInterface | null>(null)
  // const [modalCreateRowIsOpen, setModalCreateRowIsOpen] = useState(false)
  // const [modalEditRowIsOpen, setModalEditRowIsOpen] = useState(false)

  // Consts
  const namePageUppercase = 'Corridas'
  const namePageLowercase = 'corridas'
  // const namePageSingular = 'corrida'

  const itemsBreadcrumbs = [
    { label: 'Início', to: routsNameMain.home },
    { label: namePageUppercase, to: routsNameMain.rides.index },
    { label: 'Listagem' }
  ]

  // Navegação
  const handleNavigation = (page: string) => {
    navigate(page)
  }

  // Handle Select
  const handleRideStatusChange = (valueSelected: string) => {
    if (valueSelected === '') {
      setFilters(prev => ({ ...prev, status: undefined })) // limpa filtro
    } else {
      setFilters(prev => ({
        ...prev,
        status: valueSelected as RideEntity['status']
      }))
    }
    setCurrentPage(0) // sempre resetar para página inicial ao filtrar
  }

  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? 8 : value
    setDocsPerPage(rowsPerPage)
  }

  // // Abrir modal de edição
  function openModalEditRow(item: RideInterface) {
    // setRowSelect(item)
    // setModalEditRowIsOpen(true)
    console.log(item);
    
  }

  // Abrir página de detalhe
  const openPageViewRow = (id: string) => {
    handleNavigation(`${routsNameMain.rides.viewStr}${id}`)
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
        deleteRide.mutate(id)
      } else {
        swal('O registro está seguro!', { icon: 'error' })
      }
    })
  }

  // Tabela
  const rowsTable = useMemo(
    () =>
      rides?.map(item => (
        <TableRow
          key={item.id}
          rowItem={item}
          openModalEditRow={openModalEditRow}
          handleDeleteRow={handleDeleteRow}
          openPageViewRow={openPageViewRow}
        />
      )),
    [rides]
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
          options={rideStatusOptions}
          onOptionChange={e => handleRideStatusChange(e as string)}
        />
      </div>
      <div className="w-full flex flex-row justify-between items-end max-w-s-960:flex-col max-w-s-960:items-start gap-2">
        <div className="flex flex-row gap-4 items-center max-w-s-640:flex-col max-w-s-640:items-start">
          <ExportToExcel
            data={dataToExport}
            filename="rides"
            sheetName="Rideistradores"
            titlePage="Lista de Rideistradores"
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
                <th className="px-3 py-3 min-w-[12rem]">Solicitante</th>
                <th className="px-3 py-3 min-w-[12rem]">Motorista</th>
                <th className="px-3 py-3 min-w-[8rem]">Status</th>
                <th className="px-3 py-3 min-w-[10rem]">Origem</th>
                <th className="px-3 py-3 min-w-[10rem]">Destino</th>
                <th className="px-3 py-3 min-w-[8rem]">Distância</th>
                <th className="px-3 py-3 min-w-[8rem]">Preço Total</th>
                <th className="px-3 py-3 min-w-[12rem]">Data de solicitação</th>
                <th className="px-3 py-3 min-w-[8rem]">Ação</th>
              </tr>
            </thead>

            <tbody>
              {isLoadingRides ? (
                <tr>
                  <td colSpan={7} className="text-center py-6">
                    <Spinner
                      size={28}
                      className="text-primary-200 animate-spin"
                    />
                  </td>
                </tr>
              ) : rides?.length ? (
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
                {rides?.length ? currentPage * docsPerPage + 1 : 0}
              </strong>
              a
              <strong>
                {currentPage * docsPerPage + (rides?.length ?? 0)}
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

      {/* {modalCreateRowIsOpen && <ModalCreateRide ... />} */}
      {/* {modalEditRowIsOpen && <ModalEditRide ... />} */}
    </div>
  )
}
