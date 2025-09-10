import { useEffect, useMemo, useState } from 'react'

// LIBS
import swal from 'sweetalert'

// Data
import { routsNameMain } from '../../../constants/routsName'

// Services
import UserViewModel from '../../../services/ViewModel/UserViewModel'

// Table
import TableRow from '../../../components/table/TableRowUser'

// Components
import { SelectCustom } from '../../../components/selects/SelectCustom'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import ExportToExcel from '../../../components/ExportToExcel'
import { Pagination } from '../../../components/Pagination'

// Interface
import type { UserInterface } from '../../../interfaces/IUser'
import { rowPerPageOptions } from '../../../data/selectOption'
import { IoSearchSharp } from 'react-icons/io5'
import { InputWithButton } from '../../../components/input/InputWithButton'
import { Spinner } from 'phosphor-react'
// import { useNavigate } from 'react-router-dom'
import { ModalCreateUser } from './components/modal/ModalCreate'
import { ModalEditUser } from './components/modal/ModalEdit'
// import { ModalPayUser } from '../../components/modal/monthly_fee/ModalPay'

export function User() {
  // const handleNavigation = (page: string) => {
  //   navigate(page) // Navega para a página "/about"
  // }

  // State
  const [rowsData, setRowsData] = useState<UserInterface[] | null>(null)
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
  const namePageUppercase = 'Usuarios'
  const namePageLowercase = 'usuarios'
  const namePageSingular = 'Usuário'

  // List Array
  const itemsBreadcrumbs = [
    { label: 'Inicio', to: routsNameMain.home },
    { label: namePageUppercase, to: routsNameMain.users.edit },
    { label: 'Listagem' }
  ]

  const filteredRows = useMemo(() => {
    if (!termForSearch.trim()) return rowsData // Retorna todos os dados se não houver termo de busca

    const lowerCaseTerm = termForSearch.toLowerCase()

    return rowsData?.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(lowerCaseTerm)
      )
    )
  }, [rowsData, termForSearch])

  const rowsTable = filteredRows?.map((item, index) => {
    return (
      <TableRow
        key={index}
        rowItem={item}
        openModalEditRow={openModalEditRow}
        handleDeleteRow={handleDeleteRow}
      />
    )
  })

  // Handle modal
  function openModalCreateRow() {
    setModalCreateRowIsOpen(true)
  }
  function openModalEditRow(item: any) {
    setRowSelect(item)
    setModalEditRowIsOpen(true)
  }
  // Update Listing
  const handleUpdateListing = () => {
    fetchData(docsPerPage, 0)
  }

  // Function
  const fetchData = async (limit: number, offset: number) => {
    setLoading(true)
    setRowsData(null) // Clear existing data

    // Se não houver filtro, pega todos os dados
    try {
      const response = await UserViewModel.getAll(limit, offset)
      if (response.error) {
        console.error('error', response.msg)
      } else {
        setRowsData(response.data || [])
        setTotalDocs(response.pagination?.count || 0)
      }
    } catch (error) {
      console.error('error', 'Erro ao buscar dados.')
    } finally {
      setLoading(false)
    }
  }

  // Search data
  async function searchDocs() {
    if (termForSearch.length > 0) {
      fetchData(docsPerPage, 0)
    } else {
      UserViewModel.getAllByTermData(termForSearch).then(response => {
        setRowsData(response.data as UserInterface[])
      })
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
        await UserViewModel.delete(id).then(response => {
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
      Nome: doc.name,
      Email: doc.email,
      Telefone: doc.phone,
      Status: doc.status,
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
        <div className="w-full grid gap-6 md:grid-cols-7">
          {/* Filtro por enrollment_id */}
          {/* {isGettingStudents && (
            <>
              <div className="w-full flex flex-row justify-start items-center gap-4">
                <span className="text-sm font-medium  text-light">
                  Buscando estudantes!
                </span>
                <BeatLoader color="white" size={10} />
              </div>
            </>
          )} */}

          {/* {!isGettingStudents && (
            <>
              <SelectSearchableCustom
                name="enrollment_id"
                label="Estudante"
                options={rowsEnrollmentOption}
                onOptionChange={e => handleTypeUserChange(e as string)}
              />
            </>
          )} */}
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
        <ModalCreateUser
          handleUpdateListing={handleUpdateListing}
          modalCreateRowIsOpen={modalCreateRowIsOpen}
          setModalCreateRowIsOpen={setModalCreateRowIsOpen}
        />
      )}

      {modalEditRowIsOpen && (
        <ModalEditUser
          baseInfo={rowSelect}
          handleUpdateListing={handleUpdateListing}
          modalEditRowIsOpen={modalEditRowIsOpen}
          setModalEditRowIsOpen={setModalEditRowIsOpen}
        />
      )}
    </div>
  )
}
