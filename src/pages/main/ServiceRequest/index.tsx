import { useEffect, useMemo, useState } from 'react'

// LIBS
import swal from 'sweetalert'

// Data
import { routsNameMain } from '../../../constants/routsName'

// Services
import ServiceRequestViewModel from '../../../services/ViewModel/ServiceRequestViewModel'

// Table
import TableRow from '../../../components/table/TableRowServiceRequest'

// Components
import { SelectCustom } from '../../../components/selects/SelectCustom'
import { Breadcrumbs } from '../../../components/Breadcrumbs'
import ExportToExcel from '../../../components/ExportToExcel'
import { Pagination } from '../../../components/Pagination'

// Interface
import { ServiceRequestInterface } from '../../../interfaces/IServiceRequest'
import { SelectSearchableCustom } from '../../../components/selects/SelectSearchableCustom'
import { rowPerPageOptions } from '../../../data/selectOption'
import { IoSearchSharp } from 'react-icons/io5'
import { InputWithButton } from '../../../components/input/InputWithButton'
import { Spinner } from 'phosphor-react'
// import { useNavigate } from 'react-router-dom'
import { ModalCreateServiceRequest } from './components/modal/ModalCreate'
import { ModalEditServiceRequest } from './components/modal/ModalEdit'
import { OptionType } from '../../../types/option'
import { BeatLoader } from 'react-spinners'
import PatientViewModel from '../../../services/ViewModel/PatientViewModel'
import { PatientInterface } from '../../../interfaces/IPatient'
import ServiceViewModel from '../../../services/ViewModel/ServiceViewModel'
import { ServiceInterface } from '../../../interfaces/IService'

export function ServiceRequest() {
  const [filters, setFilters] = useState<Record<string, string | number>>({
    patient_id: '',
    service_id: ''
  })

  // State
  const [rowsData, setRowsData] = useState<ServiceRequestInterface[] | null>(
    null
  )
  const [loading, setLoading] = useState(false)

  const [dataToExport, setDataToExport] = useState<any[]>([])

  // Loading
  const [isGettingPatients, setIsGettingPatients] = useState<boolean>(true)
  const [isGettingServices, setIsGettingServices] = useState<boolean>(true)

  // Data
  const [rowsPatientOption, setRowsPatientOption] = useState<OptionType[]>([])
  const [rowsServiceOption, setRowsServiceOption] = useState<OptionType[]>([])

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
  const namePageUppercase = 'Solicitação de Serviços'
  const namePageLowercase = 'solicitações'
  const namePageSingular = 'solicitação'

  // List Array
  const itemsBreadcrumbs = [
    { label: 'Inicio', to: routsNameMain.home },
    { label: namePageUppercase, to: routsNameMain.patients.index },
    { label: 'Listagem' }
  ]

  const filteredRows = useMemo(() => {
    if (!termForSearch.trim()) return rowsData // Retorna todos os dados se não houver termo de busca

    const lowerCaseTerm = termForSearch.toLowerCase()

    return rowsData?.filter(row => {
      const valuesToCheck = [
        ...Object.values(row),
        row.patient.user?.name,
        row.service.name
      ]

      return valuesToCheck.some(value =>
        value?.toString().toLowerCase().includes(lowerCaseTerm)
      )
    })
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

  // Handle Select
  const handlePatientChange = (valueSelected: string) => {
    handleFilterChange(valueSelected, 'patient_id')
  }
  const handleServiceChange = (valueSelected: string) => {
    handleFilterChange(valueSelected, 'service_id')
  }

  // Function
  const fetchData = async (limit: number, offset: number) => {
    setRowsData(null) // Clear existing data

    // Verifica se há algum filtro preenchido
    const hasFilters = Object.values(filters).some(value => value !== '')

    if (!hasFilters) {
      // Se não houver filtro, pega todos os dados
      try {
        const response = await ServiceRequestViewModel.getAll(limit, offset)
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
      const response = await ServiceRequestViewModel.getAllByFields(
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
      ServiceRequestViewModel.getAllByTermData(termForSearch).then(response => {
        setRowsData(response.data as ServiceRequestInterface[])
      })
    }
  }

  // Atualiza os filtros e busca os dados
  const handleFilterChange = async (value: string | number, name: string) => {
    // Monta os filtros atualizados
    const updatedFilters = {
      ...filters,
      [name]: value
    }

    // Atualiza o estado dos filtros
    setFilters(updatedFilters)

    try {
      setLoading(true)

      // Chama o método de busca passando os filtros
      const response = await ServiceRequestViewModel.getAllByFields(
        updatedFilters,
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
        await ServiceRequestViewModel.delete(id).then(response => {
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

  async function fetchPatientData() {
    setIsGettingPatients(true)
    // Clear
    setRowsPatientOption([])

    await PatientViewModel.getAll()
      .then(async response => {
        if (response.error) {
          console.error('error', response.msg as string)
        } else {
          const arrayData = response.data as PatientInterface[]
          const dataOptions = arrayData
            .filter(data => data.id !== undefined)
            .map(data => ({
              value: String(data.id),
              label: `${data.user.entity_code} - ${data.user.name}`
            }))
          setRowsPatientOption(dataOptions)
        }
      })
      .catch(err => {
        console.error('Error to get all => ', err)
      })
      .finally(() => {
        setIsGettingPatients(false)
      })
  }
  async function fetchServiceData() {
    setIsGettingServices(true)
    // Clear
    setRowsServiceOption([])

    await ServiceViewModel.getAll()
      .then(async response => {
        if (response.error) {
          console.error('error', response.msg as string)
        } else {
          const arrayData = response.data as ServiceInterface[]
          const dataOptions = arrayData
            .filter(data => data.id !== undefined)
            .map(data => ({
              value: String(data.id),
              label: data.name
            }))
          setRowsServiceOption(dataOptions)
        }
      })
      .catch(err => {
        console.error('Error to get all => ', err)
      })
      .finally(() => {
        setIsGettingServices(false)
      })
  }

  useEffect(() => {
    fetchPatientData()
    fetchServiceData()
  }, [])

  useEffect(() => {
    fetchData(docsPerPage, 0)
  }, [])

  useEffect(() => {
    const newData = filteredRows?.map(doc => ({
      Id: `${doc.id}`,
      Paciente: doc.patient.user.name,
      Serviço: doc.service.name,
      'Data da solicitação': doc.requested_date,
      Local: doc.location,
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
        <div className="w-full grid gap-6 md:grid-cols-3">
          {/* Filtro */}

          <div>
            {isGettingPatients && (
              <>
                <div className="w-full flex flex-row justify-start items-center gap-4">
                  <span className="text-sm font-medium  text-light">
                    Buscando pacientes!
                  </span>
                  <BeatLoader color="white" size={10} />
                </div>
              </>
            )}

            {!isGettingPatients && (
              <>
                <SelectSearchableCustom
                  name="patient_id"
                  label="Paciente"
                  options={rowsPatientOption}
                  onOptionChange={e => handlePatientChange(e as string)}
                />
              </>
            )}
          </div>
          <div>
            {isGettingServices && (
              <>
                <div className="w-full flex flex-row justify-start items-center gap-4">
                  <span className="text-sm font-medium  text-light">
                    Buscando serviços!
                  </span>
                  <BeatLoader color="white" size={10} />
                </div>
              </>
            )}

            {!isGettingServices && (
              <>
                <SelectSearchableCustom
                  name="service_id"
                  label="Serviço"
                  options={rowsServiceOption}
                  onOptionChange={e => handleServiceChange(e as string)}
                />
              </>
            )}
          </div>
        </div>
        <div className="w-full flex flex-row max-w-s-960:flex-col items-end max-w-s-960:items-start justify-between gap-2 ">
          <div className="flex flex-row max-w-s-640:flex-col items-center max-w-s-640:items-start justify-between gap-4">
            <button
              // onClick={() => handleNavigation(`${routsNameMain.patients.create}`)}
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
                <th scope="col" className="px-3 py-3 min-w-[16rem]">
                  Usuário
                </th>
                <th scope="col" className="px-3 py-3 min-w-[12rem]">
                  Serviço
                </th>
                <th scope="col" className="px-3 py-3 min-w-[10rem]">
                  Status
                </th>
                {/* requested_date */}
                <th scope="col" className="px-3 py-3 min-w-[12rem]">
                  Data da solicitação
                </th>
                <th scope="col" className="px-3 py-3 min-w-[10rem]">
                  Local
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
        <ModalCreateServiceRequest
          handleUpdateListing={handleUpdateListing}
          modalCreateRowIsOpen={modalCreateRowIsOpen}
          setModalCreateRowIsOpen={setModalCreateRowIsOpen}
        />
      )}

      {modalEditRowIsOpen && (
        <ModalEditServiceRequest
          baseInfo={rowSelect}
          handleUpdateListing={handleUpdateListing}
          modalEditRowIsOpen={modalEditRowIsOpen}
          setModalEditRowIsOpen={setModalEditRowIsOpen}
        />
      )}
    </div>
  )
}
