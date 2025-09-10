import { useEffect, useMemo, useState } from 'react'

// LIBS
import swal from 'sweetalert'

// Data
import { routsNameMain } from '../../../constants/routsName'

// Services
import AdminViewModel from '../../../services/ViewModel/AdminViewModel'

// Table
import TableRow from '../../../components/table/TableRowAdmin'

// Components
import { SelectCustom } from '../../../components/selects/SelectCustom'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import ExportToExcel from '../../../components/ExportToExcel'
import { Pagination } from '../../../components/Pagination'

// Interface
import type { AdminInterface } from '../../../interfaces/IAdmin'
import { SelectSearchableCustom } from '../../../components/selects/SelectSearchableCustom'
import { adminRoleOptions, rowPerPageOptions } from '../../../data/selectOption'
import { IoSearchSharp } from 'react-icons/io5'
import { InputWithButton } from '../../../components/input/InputWithButton'
import { Spinner } from 'phosphor-react'
import { useNavigate } from 'react-router-dom'
import { ModalCreateAdmin } from './components/modal/ModalCreate'
import { ModalEditAdmin } from './components/modal/ModalEdit'
import { getAdminRoleLabel } from '../../../utils/gettersLabels'
// import { ModalPayAdmin } from '../../components/modal/monthly_fee/ModalPay'

export function Admin() {
  const [filters, setFilters] = useState<Record<string, string | number>>({
    role: ''
  })

  const navigate = useNavigate()

  const handleNavigation = (page: string) => {
    navigate(page) // Navega para a página "/about"
  }

  // State
  const [rowsData, setRowsData] = useState<AdminInterface[] | null>(null)
  const [loading, setLoading] = useState(false)

  const [dataToExport, setDataToExport] = useState<any[]>([])

  // Search
  const [termForSearch, setTermForSearch] = useState<string>('')

  const [docsPerPage, setDocsPerPage] = useState<number>(8)
  const [totalDocs, setTotalDocs] = useState<number>(0)

  const [currentPage, setCurrentPage] = useState<number>(0)

  const [rowSelect, setRowSelect] = useState<any | null>(null)

  const [modalCreateRowIsOpen, setModalCreateRowIsOpen] =
    useState<boolean>(false)
  const [modalEditRowIsOpen, setModalEditRowIsOpen] = useState<boolean>(false)

  // Consts
  const namePageUppercase = 'Administradores'
  const namePageLowercase = 'administradores'
  const namePageSingular = 'administrador'

  // List Array
  const itemsBreadcrumbs = [
    { label: 'Inicio', to: routsNameMain.home },
    { label: namePageUppercase, to: routsNameMain.users.edit },
    { label: 'Listagem' }
  ]

  const filteredRows = useMemo(() => {
    if (!termForSearch.trim()) return rowsData // Retorna todos os dados se não houver termo de busca

    const lowerCaseTerm = termForSearch.toLowerCase()

    return rowsData?.filter(row => {
      const valuesToCheck = [
        ...Object.values(row),
        row.user?.name,
        row.user?.email
      ]

      return valuesToCheck.some(value =>
        value?.toString().toLowerCase().includes(lowerCaseTerm)
      )
    })
  }, [rowsData, termForSearch])

  // openModalEditRow
  function openModalEditRow(item: any) {
    setRowSelect(item)
    setModalEditRowIsOpen(true)
  }
  // openPageViewRow
  const openPageViewRow = (id: number) => {
    handleNavigation(`${routsNameMain.admins.viewStr}${id}`)
  }

  const rowsTable = filteredRows?.map((item, index) => {
    return (
      <TableRow
        key={index}
        rowItem={item}
        openModalEditRow={openModalEditRow}
        handleDeleteRow={handleDeleteRow}
        openPageViewRow={openPageViewRow}
      />
    )
  })

  // Open Modal
  function openModalCreateRow() {
    setModalCreateRowIsOpen(true)
  }

  // Update Listing
  const handleUpdateListing = () => {
    fetchData(docsPerPage, 0)
  }

  // Handle Select
  const handleAdminRoleChange = (valueSelected: string) => {
    if (valueSelected === '') {
      setFilters(prev => ({
        ...prev,
        role: valueSelected
      }))
      fetchData(docsPerPage, 0)
    } else {
      handleFilterChange(valueSelected, 'role')
    }
  }

  // Function
  const fetchData = async (limit: number, offset: number) => {
    setRowsData(null) // Clear existing data

    // Verifica se há algum filtro preenchido
    const hasFilters = Object.values(filters).some(value => value !== '')

    if (!hasFilters) {
      // Se não houver filtro, pega todos os dados
      try {
        const response = await AdminViewModel.getAll(limit, offset)
        if (response.error) {
          console.error('error', response.msg)
        } else {
          setRowsData(response.data || [])
          setTotalDocs(response.pagination?.count || 0)
        }
      } catch (error) {
        console.error('error', 'Erro ao buscar dados.')
      }
    } else {
      // Caso existam filtros, utiliza `fetchFilterChange` para buscar os dados filtrados
      await fetchFilterChange()
    }
  }

  const fetchFilterChange = async () => {
    try {
      setLoading(true)

      console.log('filters', filters)

      // Chama o método de busca passando os filtros
      const response = await AdminViewModel.getAllByFields(
        { ...filters },
        docsPerPage,
        currentPage * docsPerPage
      )

      if (response.error) {
        console.error('error', response.msg)
        setRowsData([])
      } else {
        setRowsData(response.data || [])
        setTotalDocs(response.pagination?.count || 0)
      }
    } catch (err) {
      console.error('error', 'Ocorreu um erro durante a pesquisa')
    } finally {
      setLoading(false)
    }
  }

  // Search data
  async function searchDocs() {
    if (termForSearch == '') {
      fetchData(docsPerPage, 0)
    } else {
      AdminViewModel.getAllByTermData(termForSearch).then(response => {
        setRowsData(response.data as AdminInterface[])
      })
    }
  }

  // Atualiza os filtros e busca os dados
  const handleFilterChange = async (value: string | number, name: string) => {
    // Atualiza o estado dos filtros
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))

    try {
      setLoading(true)

      // Chama o método de busca passando os filtros
      const response = await AdminViewModel.getAllByFields(
        {
          ...filters,
          [name]: value // Atualiza o filtro modificado
        },
        docsPerPage,
        currentPage * docsPerPage
      )

      if (response.error) {
        console.error('error', response.msg)
        setRowsData([])
      } else {
        setRowsData(response.data || [])
        setTotalDocs(response.pagination?.count || 0)
      }
    } catch (err) {
      console.error('error', 'Ocorreu um erro durante a pesquisa')
    } finally {
      setLoading(false)
    }
  }

  // Delete row
  function handleDeleteRow(id: number) {
    swal({
      title: 'Tem certeza?',
      text: 'Uma vez excluído, você não poderá recuperar!',
      buttons: ['Cancelar', 'Confirmar'],
      icon: 'warning',
      dangerMode: true
    }).then(async willDelete => {
      if (willDelete) {
        await AdminViewModel.delete(id).then(response => {
          console.log(response)

          if (response.error) {
            swal(`Erro ao deletar registo: ${response.msg}`, {
              icon: 'error'
            })
            console.error('', response.msg)
          } else {
            swal('Deletado com sucesso', {
              icon: 'success'
            })

            fetchData(docsPerPage, currentPage * docsPerPage)
          }
        })
      } else {
        swal('O registo está seguro!', {
          icon: 'error'
        })
      }
    })
  }
  // Change rows per page
  const handleSelectChange = (value: number) => {
    const rowsPerPage = value === -1 ? totalDocs : value
    setDocsPerPage(rowsPerPage)
    setCurrentPage(0) // Reset to first page
    fetchData(rowsPerPage, 0)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchData(docsPerPage, newPage * docsPerPage)
  }

  useEffect(() => {
    fetchData(docsPerPage, 0)
  }, [])

  useEffect(() => {
    const newData = filteredRows?.map(doc => ({
      Id: `${doc.id}`,
      Nome: doc.user.name,
      Email: doc.user.email,
      Telefone: doc.user.phone,
      Status: doc.user.status,
      Permissão: getAdminRoleLabel(doc.role),
      'Data de criacao': doc?.created_at,
      'Ultima atualização': doc?.updated_at
    }))

    setDataToExport(newData as any)
  }, [filteredRows])

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-6">
      <div className="w-full p-6 flex flex-col justify-start items-start gap-6 rounded-md bg-light dark:bg-dark">
        <div className="w-full flex flex-row max-w-s-960:flex-col items-center max-w-s-960:items-start justify-between gap-2 ">
          <h1 className="text-2xl font-bold text-dark dark:text-light ">
            {namePageUppercase}
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
      </div>

      <div className="w-full h-full flex flex-col justify-start items-start gap-6">
        <div className="w-full grid gap-6 md:grid-cols-5">
          {/* Filtro por role */}
          <SelectSearchableCustom
            name="role"
            label="Função de administrador"
            options={adminRoleOptions}
            onOptionChange={e => handleAdminRoleChange(e as string)}
          />
        </div>
        <div className="w-full flex flex-row max-w-s-960:flex-col items-end max-w-s-960:items-start justify-between gap-2 ">
          <div className="flex flex-row max-w-s-640:flex-col items-center max-w-s-640:items-start justify-between gap-4">
            <button
              // onClick={() => handleNavigation(`${routsNameMain.users.create}`)}
              onClick={openModalCreateRow}
              className="py-2 px-4 rounded-lg bg-primary-200 text-white hover:bg-primary-500 active:bg-primary-700 flex flex-row items-center justify-center gap-4 transition-all duration-300 "
            >
              Cadastrar {namePageSingular}
            </button>

            <ExportToExcel
              data={dataToExport}
              filename="list_data"
              sheetName="List"
              titlePage="Lista"
              imageSrc="http://localhost:5173/logo/logo.png"
              orientation="landscape"
              scale={0.8}
            />
          </div>

          <div className="w-full max-w-sm">
            <InputWithButton
              onChange={e => setTermForSearch(e.target.value)}
              placeholder="Digite algo"
              // buttonText="Enviar"
              icon={<IoSearchSharp size={20} />}
              onButtonClick={() => searchDocs()}
            />
          </div>
        </div>
      </div>

      <div className="w-full p-6 flex flex-col justify-start items-start gap-6 rounded-md bg-light dark:bg-dark">
        <h1 className="text-xl font-bold text-dark dark:text-light ">
          Listagem de {namePageLowercase}
        </h1>

        <div className="relative w-full overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-sm font-thin bg-gray-300/40 dark:bg-gray-500/40 ">
              <tr className="border-b dark:border-gray-700">
                <th scope="col" className="px-3 py-3 w-[0rem] ">
                  Id
                </th>
                <th scope="col" className="px-3 py-3 min-w-[18rem]">
                  Usuário
                </th>
                <th scope="col" className="px-3 py-3 min-w-[8rem]">
                  Telefone
                </th>
                <th scope="col" className="px-3 py-3 min-w-[8rem]">
                  Status
                </th>
                <th scope="col" className="px-3 py-3 min-w-[10rem]">
                  Tipo de Usuário
                </th>
                <th scope="col" className="px-3 py-3 min-w-[12rem]">
                  Data de Cadastro
                </th>
                <th scope="col" className="px-3 py-3 min-w-[8rem] ">
                  Ação
                </th>
              </tr>
            </thead>

            {loading ? (
              <div className="flex justify-center items-center w-full h-full">
                <Spinner />
              </div>
            ) : (
              rowsTable
            )}
          </table>
          {filteredRows?.length === undefined && (
            <div className="w-full ">
              <p>Não há registros para exibir.</p>
            </div>
          )}

          <div className="pt-4 flex flex-row max-w-s-960:flex-col justify-between items-center max-w-s-960:items-start gap-1 max-w-s-960:gap-3">
            <p className="text-xs flex flex-row justify-start items-center gap-1 whitespace-nowrap">
              Mostrando
              <strong className="text-dark dark:text-light font-semibold">
                {filteredRows?.length !== undefined ? '1' : '0'}
              </strong>
              a
              <strong className="text-dark dark:text-light font-semibold">
                {filteredRows?.length !== undefined
                  ? filteredRows?.length
                  : '0'}
              </strong>
              de
              <strong className="text-dark dark:text-light font-semibold">
                {totalDocs}
              </strong>
              {namePageUppercase}
            </p>

            <div className="flex flex-row justify-center items-center gap-4 mb-3 max-w-s-640:flex-wrap">
              <div className="flex-1 flex flex-row justify-start items-center gap-4 max-w-s-520:flex-wrap">
                <span className="">Registos por página: </span>

                <span className="max-w-24">
                  <SelectCustom
                    options={rowPerPageOptions}
                    selectedValue={docsPerPage}
                    onChange={value => handleSelectChange(Number(value))}
                  />
                </span>
              </div>

              <Pagination
                currentPage={currentPage}
                totalDocs={totalDocs}
                docsPerPage={docsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>

      {modalCreateRowIsOpen && (
        <ModalCreateAdmin
          handleUpdateListing={handleUpdateListing}
          modalCreateRowIsOpen={modalCreateRowIsOpen}
          setModalCreateRowIsOpen={setModalCreateRowIsOpen}
        />
      )}

      {modalEditRowIsOpen && (
        <ModalEditAdmin
          baseInfo={rowSelect}
          handleUpdateListing={handleUpdateListing}
          modalEditRowIsOpen={modalEditRowIsOpen}
          setModalEditRowIsOpen={setModalEditRowIsOpen}
        />
      )}
    </div>
  )
}
