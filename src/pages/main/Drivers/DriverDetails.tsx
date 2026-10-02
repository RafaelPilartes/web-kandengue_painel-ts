import { useEffect, useState } from 'react'
import swal from 'sweetalert'
import {
  useParams
  // useNavigate
} from 'react-router-dom'
import { Spinner, Star } from 'phosphor-react'

// Components do teu projeto (ajusta imports conforme necessário)
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Car,
  Check,
  CircleFadingArrowUp,
  ClipboardList,
  Download,
  FileText,
  Hash,
  Mail,
  Phone,
  Wallet,
  Wallet2,
  XIcon
} from 'lucide-react'
import { useDriversViewModel } from '@/viewModels/DriverViewModel'
import { useWalletsViewModel } from '@/viewModels/WalletViewModel'
import { useVehiclesViewModel } from '@/viewModels/VehicleViewModel'
import { useDocumentsViewModel } from '@/viewModels/DocumentViewModel'
import type { WalletInterface } from '@/interfaces/IWallet'
import type { VehicleInterface } from '@/interfaces/IVehicle'
import { RIDE_TYPES, type RideType } from '@rafaelpilartes/kandengue-shared/enums'
import { RIDE_TYPE_LABELS } from '@rafaelpilartes/kandengue-shared/constants'
import type { DocumentInterface } from '@/interfaces/IDocument'
import type { DriverInterface } from '@/interfaces/IDriver'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import type { RideInterface } from '@/interfaces/IRide'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { formatMoney } from '@/utils/number'
import { Card } from '@/components/ui/card'
import { useTransactionsViewModel } from '@/viewModels/TransactionViewModel'
import { useWalletTopupRequestsViewModel } from '@/viewModels/WalletTopupRequestViewModel'
import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import { showToast, showToastLoading, updateToast } from '@/utils/toasts'
import type { TransactionInterface } from '@/interfaces/ITransaction'
import {
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getRideStatusLabel,
  getUserStatusLabel,
  getVehicleStatusLabel,
  getWalletTopupMethodTypeLabel,
  getWalletTopupStatusLabel
} from '@/utils/gettersLabels'
import { ActionsMenu } from '@/components/ActionsMenu'
import { IoColorPaletteSharp } from 'react-icons/io5'
import { BadgeSimple } from '@/components/badge/BadgeSimple'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'
import type { DocumentStatus } from '@/types/enum'
import { userStatusOptions } from '@/data/selectOption'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { DriverProgressTracker } from '@/components/drivers/DriverProgressTracker'
import { WalletStatement } from '@/components/wallet/WalletStatement'

export function DriverViewPage() {
  const { driverId } = useParams<{ driverId: string }>()
  // const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)

  const { fetchDriverById, updateDriver } = useDriversViewModel()
  const { fetchOneWalletByField } = useWalletsViewModel()
  const { fetchAllTransactionsByField } = useTransactionsViewModel()
  const { fetchAllRidesByField, calculateDriverEarnings } = useRidesViewModel()
  const { fetchAllVehiclesByField, reviewVehicle } = useVehiclesViewModel()
  const { fetchAllDocumentsByField, filterDocsBy, updateDocument } =
    useDocumentsViewModel()
  const { fetchAllWalletTopupRequestsByField } =
    useWalletTopupRequestsViewModel()

  // Data
  const [rowDataDriver, setRowDataDriver] = useState<DriverInterface | null>(
    null
  )
  const [rowDataWallet, setRowDataWallet] = useState<WalletInterface | null>(
    null
  )
  const [rowsDataTransactions, setRowsDataTransactions] = useState<
    TransactionInterface[] | null
  >(null)
  const [rowsDataRides, setRowsDataRides] = useState<RideInterface[] | null>(
    null
  )
  const [rowsDataVehicles, setRowsDataVehicles] = useState<
    VehicleInterface[] | null
  >(null)
  const [rowsDataDocuments, setRowsDataDocuments] = useState<
    DocumentInterface[] | null
  >(null)
  const [rowsDataTopups, setRowsDataTopups] = useState<
    WalletTopupRequestInterface[] | null
  >(null)

  const [driverEarnings, setDriverEarnings] = useState<number>(0)
  const [documentsPending, setDocumentsPending] = useState<
    DocumentInterface[] | null
  >(null)

  const [isUpdatingStatus, setUpdatingStatus] = useState<boolean>(false)
  const [isUpdatingServices, setUpdatingServices] = useState<boolean>(false)

  const [docDriverLicense, setDocDriverLicense] =
    useState<DocumentInterface | null>(null)
  const [docIdFront, setDocIdFront] = useState<DocumentInterface | null>(null)
  const [docIdBack, setDocIdBack] = useState<DocumentInterface | null>(null)

  async function getTransitionsByWallet() {
    const result = await fetchAllTransactionsByField(
      'wallet_id',
      rowDataWallet?.id
    )

    if (result && result?.data.length >= 1) {
      setRowsDataTransactions(result.data)
    }
  }

  // Handler

  // Os serviços que o motorista está aprovado a fazer. É o que o dispatch
  // filtra — nunca o veículo — e só o admin os escreve (as regras negam-no
  // ao motorista). É aqui que o Moto Táxi será aprovado.
  const handleToggleService = async (service: RideType) => {
    if (!rowDataDriver) return
    const current = rowDataDriver.services ?? []
    const services = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service]
    try {
      setUpdatingServices(true)
      await updateDriver.mutateAsync({
        id: rowDataDriver.id as string,
        driver: { services }
      })
      setRowDataDriver({ ...rowDataDriver, services })
      showToast(
        'success',
        `Serviços aprovados: ${services.map(s => RIDE_TYPE_LABELS[s]).join(', ') || 'nenhum'}`
      )
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao actualizar os serviços do motorista')
    } finally {
      setUpdatingServices(false)
    }
  }
  const handleDefaultVehicle = async (vehicle: VehicleInterface) => {
    if (!rowDataDriver) {
      return
    }

    if (vehicle.status == 'under_analysis' || vehicle.status == 'rejected') {
      showToast('error', `Não é possível predefinir esse veiculo`)
      return
    }

    const isSelected = rowDataDriver.vehicle?.id === vehicle.id

    if (isSelected) {
      showToast('info', `Este veiculo já foi predefinido`)
      return
    }

    try {
      const dataToUpdate: Partial<DriverInterface> = {
        vehicle: {
          ...vehicle
        }
      }

      await updateDriver.mutateAsync({
        id: rowDataDriver?.id as string,
        driver: dataToUpdate
      })

      showToast('success', `Veiculo ${vehicle.brand}, definido com principal`)

      setRowDataDriver({
        ...rowDataDriver,
        vehicle
      })
    } catch (err) {
      const message = mapFirebaseError(err)

      showToast('error', message)
    }
  }

  /**
   * Validar ou recusar pela API, nunca pelo Firestore.
   *
   * `status == 'validated'` é um dos filtros do dispatch: é o que põe o
   * motorista a receber corridas. O painel escrevia-o directamente e sem
   * motivo; as regras passaram a negar `status` ao cliente, admin incluído,
   * e quem decide é `POST /api/v1/admin/vehicles/:id/review`.
   *
   * A recusa pede o motivo aqui mesmo — é o que o motorista vai ler na app.
   */
  const handleValidateVehicle = async (
    vehicle: VehicleInterface,
    type: 'validated' | 'rejected'
  ) => {
    let reason: string | undefined

    if (type === 'rejected') {
      const willReject = await swal({
        title: `Recusar a viatura ${vehicle.plate}?`,
        text: 'O motivo fica visível ao motorista na app.',
        content: {
          element: 'textarea',
          attributes: {
            placeholder: 'Motivo da recusa — o que o motorista tem de corrigir',
            rows: 4,
            id: 'driver-vehicle-rejection-reason'
          }
        },
        buttons: ['Cancelar', 'Recusar'],
        icon: 'warning',
        dangerMode: true
      })

      if (!willReject) return

      const textarea = document.getElementById(
        'driver-vehicle-rejection-reason'
      ) as HTMLTextAreaElement | null
      reason = textarea?.value.trim()

      if (!reason) {
        showToast('error', 'É obrigatório indicar o motivo da recusa')
        return
      }
    }

    try {
      const result = await reviewVehicle.mutateAsync({
        id: vehicle.id as string,
        decision: type,
        reason
      })

      // O estado de cada viatura lê-se sempre de `vehicles` — não da cópia
      // desnormalizada em `drivers.vehicle`, que pode estar atrasada.
      const resultVehicle = await fetchAllVehiclesByField('user_id', driverId)

      if (resultVehicle?.data) {
        setRowsDataVehicles(resultVehicle?.data)
      }

      if (!result.changed) {
        showToast('info', `Esta viatura já estava ${result.status === 'validated' ? 'validada' : 'recusada'}`)
        return
      }

      showToast(
        'success',
        `Viatura ${vehicle.plate} ${type === 'validated' ? 'validada' : 'recusada'}`
      )
    } catch (err) {
      // A mensagem da API é a que explica porque é que não passou (por
      // exemplo: retirar uma viatura já validada não se faz por aqui).
      showToast(
        'error',
        err instanceof Error ? err.message : mapFirebaseError(err)
      )
    }
  }

  const handleDownloadDocument = async (doc: DocumentInterface) => {
    try {
      const url = doc.url
      const filename = `${getDocumentTypeLabel(doc.type)}-${
        rowDataDriver?.name
      }.jpg`

      // Método mais confiável para Firebase Storage
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.target = '_blank' // Importante para URLs externas
      a.rel = 'noopener noreferrer'

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      showToast('error', 'Erro ao abrir o documento.')
      console.error('Erro ao abrir o documento:', error)
    }
  }
  const handleValidateDocument = async (
    document: DocumentInterface,
    type: DocumentStatus
  ) => {
    const toastId = showToastLoading(
      `${type === 'approved' ? 'Aprovando' : 'Rejeitando'} documento`
    )

    try {
      const dataToUpdate: Partial<DocumentInterface> = {
        status: type
      }

      const documentUpdated = await updateDocument.mutateAsync({
        id: document.id as string,
        document: dataToUpdate
      })

      const resultDocument = await fetchAllDocumentsByField('user.id', driverId)

      if (resultDocument?.data) {
        setRowsDataDocuments(resultDocument?.data)
      }

      updateToast(
        toastId,
        'success',
        `Documento ${getDocumentTypeLabel(documentUpdated.type)}, foi ${
          type === 'approved' ? 'aprovado' : 'rejeitado'
        }`
      )
    } catch (err) {
      const message = mapFirebaseError(err)
      updateToast(toastId, 'error', message)
    }
  }

  const validateDocumentsBeforeActivation = () => {
    const missing: string[] = []

    if (!docDriverLicense || docDriverLicense.status !== 'approved')
      missing.push('Carta de condução')
    if (!docIdFront || docIdFront.status !== 'approved')
      missing.push('BI - Frente')
    if (!docIdBack || docIdBack.status !== 'approved')
      missing.push('BI - Verso')

    return missing
  }
  const handleStatusChange = async (valueSelected: string) => {
    if (!valueSelected || !rowDataDriver) return

    try {
      setUpdatingStatus(true)

      if (valueSelected === 'active') {
        const missing = validateDocumentsBeforeActivation()

        if (missing.length > 0) {
          showToast('error', `Documentos em falta: ${missing.join(', ')}`)
          return
        }
      }

      const dataToUpdate: Partial<DriverInterface> = {
        status: valueSelected as DriverInterface['status']
      }

      await updateDriver.mutateAsync({
        id: rowDataDriver.id as string,
        driver: dataToUpdate
      })

      // Atualizar o estado local do driver
      setRowDataDriver({
        ...rowDataDriver,
        status: valueSelected as DriverInterface['status']
      })

      showToast(
        'success',
        `Status do motorista atualizado para - ${getUserStatusLabel(
          valueSelected as DriverInterface['status']
        )}`
      )
    } catch (error) {
      console.error(error)
      showToast('error', 'Erro ao atualizar status do motorista')
    } finally {
      setUpdatingStatus(false)
    }
  }
  // Function
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      if (!driverId) {
        alert('Não foi fornecido id do motorista')
        return
      }

      try {
        // Executa ambas as requisições em paralelo
        const [
          dataDriver,
          dataWallet,
          dataRides,
          dataVehicles,
          dataDocuments,
          dataTopups
        ] = await Promise.all([
          fetchDriverById(driverId),
          fetchOneWalletByField('user.id' as any, driverId),
          fetchAllRidesByField('driver.id', driverId),
          fetchAllVehiclesByField('user_id', driverId),
          fetchAllDocumentsByField('user.id', driverId),
          // `topupRequests.user_id` guarda o ID DO DOCUMENTO do motorista
          // (a app escreve `driver.id`), não o uid do Auth.
          fetchAllWalletTopupRequestsByField('user_id', driverId, 100)
        ])

        // Lida com Driver
        if (!dataDriver) {
          console.error('Erro ao buscar motoristas')
        } else {
          setRowDataDriver(dataDriver)
        }
        // Lida com Wallet
        if (!dataWallet) {
          showToast('error', 'Erro ao identificar a carteira')
        } else {
          setRowDataWallet(dataWallet)
        }
        // Lida com Rides
        if (!dataRides) {
          console.error('Erro ao buscar corridas')
        } else {
          setRowsDataRides(dataRides.data)
        }
        // Lida com Vehicles
        if (!dataVehicles) {
          console.error('Erro ao buscar veiculos')
        } else {
          setRowsDataVehicles(dataVehicles.data)
        }
        // Lida com Documents
        if (!dataDocuments) {
          console.error('Erro ao buscar documentos')
        } else {
          setRowsDataDocuments(dataDocuments.data)
        }
        // Lida com os carregamentos da carteira
        if (!dataTopups) {
          console.error('Erro ao buscar carregamentos')
        } else {
          setRowsDataTopups(dataTopups.data)
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [driverId])

  useEffect(() => {
    if (rowsDataRides) {
      const earnings = calculateDriverEarnings(rowsDataRides)
      setDriverEarnings(earnings)
    }
    if (rowsDataDocuments) {
      const documentsPending = filterDocsBy(
        rowsDataDocuments,
        'status',
        'pending'
      )
      setDocumentsPending(documentsPending)

      // driver_license
      const driverLicenseFiltered = filterDocsBy(
        rowsDataDocuments,
        'type',
        'driver_license'
      )
      const driverLicenseFounded = driverLicenseFiltered.find(
        doc => doc.status === 'approved'
      )
      setDocDriverLicense(driverLicenseFounded ?? null)

      // id_front
      const idFrontFiltered = filterDocsBy(
        rowsDataDocuments,
        'type',
        'id_front'
      )
      const idFrontFounded = idFrontFiltered.find(
        doc => doc.status === 'approved'
      )
      setDocIdFront(idFrontFounded ?? null)

      // id_back
      const idBackFiltered = filterDocsBy(rowsDataDocuments, 'type', 'id_back')
      const idBackFounded = idBackFiltered.find(
        doc => doc.status === 'approved'
      )
      setDocIdBack(idBackFounded ?? null)
    }
  }, [rowsDataRides, rowsDataDocuments])

  useEffect(() => {
    if (rowDataWallet) {
      getTransitionsByWallet()
    }
  }, [rowDataWallet])

  if (isLoading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-row items-center justify-center gap-4">
        <span className="text-2xl text-gray-700 dark:text-gray-200">
          Carregando dados do motorista
        </span>
        <Spinner size={36} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!rowDataDriver) {
    return (
      <div className="p-8 text-center text-sm text-gray-600 dark:text-gray-300">
        Motorista não encontrado.
      </div>
    )
  }

  const actionsVehicle = (vehicle: VehicleInterface) => {
    // const isInvalid =
    //   vehicle.status === 'under_analysis' || vehicle.status === 'rejected'
    const isUnderAnalysis = vehicle.status === 'under_analysis'

    const actions = []

    // Adiciona a ação de "Predefinir" se o veículo não for selecionado e não for inválido
    if (!isUnderAnalysis) {
      actions.push({
        icon: <CircleFadingArrowUp size={16} />,
        label: 'Predefinir',
        onClick: () => handleDefaultVehicle(vehicle)
      })
    }

    // Adiciona as ações de "Aprovar" e "Rejeitar" se o veículo estiver "under_analysis"
    if (isUnderAnalysis) {
      actions.push(
        {
          icon: <Check size={16} />,
          label: 'Aprovar',
          onClick: () => handleValidateVehicle(vehicle, 'validated'),
          className:
            'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900'
        },
        {
          icon: <XIcon size={16} />,
          label: 'Rejeitar',
          onClick: () => handleValidateVehicle(vehicle, 'rejected'),
          className:
            'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
        }
      )
    }

    return actions
  }

  const actionsDocument = (doc: DocumentInterface) => {
    const actions = []

    actions.push({
      icon: <Download size={16} />,
      label: 'Abrir',
      onClick: () => handleDownloadDocument(doc)
    })

    if (doc.status === 'pending') {
      actions.push(
        {
          icon: <Check size={16} />,
          label: 'Aprovar',
          onClick: () => handleValidateDocument(doc, 'approved'),
          className:
            'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900'
        },
        {
          icon: <XIcon size={16} />,
          label: 'Rejeitar',
          onClick: () => handleValidateDocument(doc, 'rejected'),
          className:
            'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
        }
      )
    }

    return actions
  }

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Header */}
      <div className="w-full flex items-center gap-4 border-b border-gray-400 dark:border-gray-600 pb-4 max-w-s-640:flex-col">
        {/* Top */}
        <div className="w-full flex items-center justify-between gap-6 max-w-s-520:flex-col max-w-s-520:gap-4">
          {/* Avatar */}
          <div className="">
            <Avatar
              src={rowDataDriver.photo}
              fallback={rowDataDriver.name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')}
              alt="Driver"
              size="xl"
            />
          </div>

          {/* Content */}
          <div className="w-full flex flex-col max-w-s-520:items-center">
            {/* Name */}
            <div className="w-full flex flex-row items-center gap-4 mb-4 max-w-s-640:gap-2 max-w-s-640:flex-col max-w-s-640:items-start max-w-s-640:mb-4 max-w-s-520:items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {rowDataDriver.name}
              </h2>

              <div className="flex flex-wrap gap-2 justify-center items-center">
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    rowDataDriver.is_online
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/40'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/40'
                  }`}
                >
                  {rowDataDriver.is_online ? 'Online' : 'Offline'}
                </span>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 text-sm">
                  <Star size={14} />{' '}
                  <span className="ml-1 font-medium">
                    {rowDataDriver.rating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="w-full text-xs flex flex-row flex-wrap gap-2 max-w-s-520:justify-center text-gray-600 dark:text-gray-300">
              <div className="flex flex-row justify-start items-center gap-1">
                <Hash size={14} /> {rowDataDriver.id || 'N/A'}
              </div>
              <span className="hidden text-sm xs:inline">|</span>
              <div className="flex flex-row justify-start items-center gap-1">
                <Phone size={14} /> {rowDataDriver.phone}
              </div>
              <span className="hidden text-sm xs:inline">|</span>
              <div className="flex flex-row justify-start items-center gap-1">
                <Mail size={14} /> {rowDataDriver.email}
              </div>
            </div>
          </div>
        </div>

        {/* Member */}
        <div
          className={`w-44 flex flex-col justify-center items-center py-2 px-3 text-xs font-normal rounded-full bg-red-200 text-red-600`}
        >
          Membro desde:
          <span className="font-semibold">
            {formatDateTimeFromFirestore(rowDataDriver.created_at as any).date}
          </span>
        </div>
      </div>

      <div className="w-full max-w-32 flex flex-col gap-4">
        <SelectCustom
          htmlFor="status"
          selectedValue={rowDataDriver?.status || 'pending'}
          label="Estado da conta"
          options={userStatusOptions}
          onChange={handleStatusChange}
          isLoading={isUpdatingStatus}
        />
      </div>

      {/* Serviços aprovados — só o admin escreve; o dispatch filtra por aqui */}
      <div className="w-full flex flex-col gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Serviços aprovados
        </span>
        <div className="flex flex-wrap gap-2">
          {RIDE_TYPES.map(service => {
            const approved = (rowDataDriver?.services ?? []).includes(service)
            return (
              <button
                key={service}
                type="button"
                disabled={isUpdatingServices}
                onClick={() => handleToggleService(service)}
                className={`px-3 py-1.5 rounded-xl text-sm border transition-colors disabled:opacity-50 ${
                  approved
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                {RIDE_TYPE_LABELS[service]}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          O motorista só recebe corridas dos serviços aprovados. A viatura
          validada (separador Veículos, lida da colecção vehicles) é exigida à parte.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          title="Saldo Carteira"
          icon={<Wallet />}
          value={
            rowDataWallet
              ? `AOA ${formatMoney(rowDataWallet?.balance as number)}`
              : 'Sem carteira criada'
          }
        />
        <Card
          title="Corridas Concluídas"
          icon={<ClipboardList />}
          value={`${rowsDataRides?.length}`}
        />
        <Card
          title="Veículos"
          icon={<Car />}
          value={`${rowsDataVehicles?.length} disponiveis`}
        />
        <Card
          title="Documentos"
          icon={<FileText />}
          value={`${documentsPending?.length} Pendentes`}
        />
        <Card title="Ganhos" icon={<Wallet2 />} value={`${driverEarnings}`} />
      </div>

      {/* Main content: responsive grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/center: main tabs (span 2 on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <Tabs defaultValue="wallet">
              <TabsList>
                <TabsTrigger value="wallet">Carteira</TabsTrigger>
                <TabsTrigger value="topups">Carregamentos</TabsTrigger>
                <TabsTrigger value="rides">Corridas</TabsTrigger>
                <TabsTrigger value="vehicles">Veículos</TabsTrigger>
                <TabsTrigger value="docs">Documentos</TabsTrigger>
                <TabsTrigger value="missions">Missões</TabsTrigger>
              </TabsList>

              {/* Carteira */}
              <TabsContent value="wallet">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Movimentos na Carteira
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Os débitos de comissão mostram as três parcelas — empresa,
                    fundo de pensões e seguro —, que é o que explica o valor.
                    O saldo corrido é reconstruído a partir do saldo actual.
                  </p>
                  <div className="mt-4">
                    <WalletStatement
                      transactions={rowsDataTransactions}
                      balance={rowDataWallet?.balance}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Carregamentos da carteira */}
              <TabsContent value="topups">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Carregamentos da Carteira
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Os dois fluxos na mesma lista: as transferências que o
                    painel confirma e os carregamentos por Unitel Money, que
                    fecham pelo callback da operadora.
                  </p>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2">Data</th>
                          <th className="px-3 py-2">Valor</th>
                          <th className="px-3 py-2">Método</th>
                          <th className="px-3 py-2">Estado</th>
                          <th className="px-3 py-2">Comprovativo</th>
                          <th className="px-3 py-2">Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsDataTopups?.length ? (
                          rowsDataTopups.map(topup => {
                            const createdAt = formatDateTimeFromFirestore(
                              topup.created_at
                            )
                            return (
                              <tr
                                key={topup.id}
                                className="border-b border-gray-100 dark:border-gray-700"
                              >
                                <td className="px-3 py-2 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                                  {createdAt.date}
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    {createdAt.time}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-semibold">
                                  {formatMoney(topup.amount)}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  {getWalletTopupMethodTypeLabel(topup.method)}
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  <BadgeSimple
                                    label={getWalletTopupStatusLabel(
                                      topup.status
                                    )}
                                    color={
                                      topup.status === 'approved' ||
                                      topup.status === 'success'
                                        ? 'green'
                                        : topup.status === 'pending' ||
                                          topup.status === 'processing'
                                        ? 'yellow'
                                        : 'red'
                                    }
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  {topup.proof_url ? (
                                    <a
                                      href={topup.proof_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:text-blue-400 text-xs"
                                    >
                                      Abrir
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      —
                                    </span>
                                  )}
                                </td>
                                {/* Para um rejeitado é o motivo que o admin
                                    escreveu; para um falhado, o que a Unitel
                                    devolveu. */}
                                <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                                  {topup.rejected_reason ??
                                    topup.failure_message ??
                                    '—'}
                                </td>
                              </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="text-center py-6 text-sm text-gray-500 dark:text-gray-400"
                            >
                              Nenhum carregamento
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* Corridas */}
              <TabsContent value="rides">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md  dark:border-gray-700">
                  <h4 className="text-sm font-semibold">Lista de Corridas</h4>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Passageiro</th>
                          <th className="px-3 py-2">Origem</th>
                          <th className="px-3 py-2">Destino</th>
                          <th className="px-3 py-2">Valor</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsDataRides?.map((ride, idx) => (
                          <tr
                            key={ride.id}
                            className="border-b border-gray-100 dark:border-gray-700"
                          >
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2">{ride.user.name}</td>
                            <td className="px-3 py-2">
                              {ride.pickup.name ?? '-'}
                            </td>
                            <td className="px-3 py-2">
                              {ride.dropoff.name ?? '-'}
                            </td>
                            <td className="px-3 py-2">
                              {formatMoney(ride.fare?.total ?? 0)}
                            </td>
                            <td className="px-3 py-2">
                              {getRideStatusLabel(ride.status)}
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={6} className="text-center py-6">
                              Nenhuma corrida encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* Veículos */}
              <TabsContent value="vehicles">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md  dark:border-gray-700">
                  <h4 className="text-sm font-semibold">Veículos</h4>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rowsDataVehicles?.map(vehicle => (
                      <div
                        key={vehicle.id}
                        className={`p-4 flex flex-col gap-2 rounded-md border ${
                          rowDataDriver.vehicle?.id === vehicle.id
                            ? 'border-primary-400 ring-2 ring-primary-200/30'
                            : 'border-gray-100 dark:border-gray-700'
                        } bg-white dark:bg-gray-800`}
                      >
                        {/* Image */}
                        <div className="h-28 w-full bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden flex items-center justify-center">
                          <img
                            src={vehicle.image}
                            alt={vehicle.type}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col items-center justify-between">
                          {/* Brand & Actions */}
                          <div className="w-full flex flex-row items-center justify-between">
                            {/* Brand */}
                            <div className="w-full flex flex-col items-start gap-0">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {vehicle.brand} - {vehicle.model}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Placa: {vehicle.plate}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row justify-start items-center gap-4">
                              <ActionsMenu actions={actionsVehicle(vehicle)} />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="w-full flex flex-col items-start justify-start gap-4">
                            {/* Color */}
                            <div className="w-full flex flex-row items-center justify-start">
                              <IoColorPaletteSharp
                                size={16}
                                className="text-xs text-gray-500 dark:text-gray-400 mr-1"
                              />

                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                                Cor:{' '}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-white">
                                {vehicle.color}
                              </span>
                            </div>

                            {/* Status */}
                            <div
                              className={`w-auto flex flex-col justify-center items-center py-1 px-3 text-xs font-normal rounded-full ${
                                vehicle.status === 'validated'
                                  ? 'bg-green-100 text-green-700'
                                  : vehicle.status === 'rejected'
                                    ? 'bg-red-200 text-red-700'
                                    : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              <span className="text-xs font-medium">
                                {getVehicleStatusLabel(vehicle.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-sm text-gray-500">
                        Nenhum veículo cadastrado
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Documentos */}
              <TabsContent value="docs">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md  dark:border-gray-700">
                  <h4 className="text-sm font-semibold">
                    Documentos submetidos
                  </h4>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2">Id</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Data</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rowsDataDocuments?.length ? (
                          rowsDataDocuments.map(doc => (
                            <tr
                              key={doc.id}
                              className="border-b border-gray-100 dark:border-gray-700"
                            >
                              <td className="px-3 py-2 text-sm">{doc.id}</td>
                              <td className="px-3 py-2 text-sm">
                                {getDocumentTypeLabel(doc.type)}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                                <BadgeSimple
                                  color={
                                    doc.status === 'approved'
                                      ? 'green'
                                      : doc.status === 'pending'
                                        ? 'orange'
                                        : 'red'
                                  }
                                  label={getDocumentStatusLabel(doc.status)}
                                />
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                {
                                  formatDateTimeFromFirestore(
                                    doc.created_at as any
                                  ).date
                                }
                              </td>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-200">
                                {/* Actions */}
                                <div className="flex flex-row justify-start items-center gap-4">
                                  <ActionsMenu actions={actionsDocument(doc)} />
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-6 text-sm text-gray-500 dark:text-gray-400"
                            >
                              Nenhum documento
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* Missões */}
              <TabsContent value="missions">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md dark:border-gray-700">
                  <DriverProgressTracker driver_id={driverId!} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right column: perfil rápido e ações */}
        <aside className="flex flex-col gap-4">
          {/* Resume */}
          {/* <div className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Resumo Rápido
            </div>
            <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <strong>Último acesso:</strong>{' '}
              </div>
              <div>
                <strong>Nº de corridas:</strong>{' '}
                {'driverMock.stats?.ridesCompleted ?? 0'}
              </div>
              <div>
                <strong>Último pagamento:</strong>{' '}
                {
                  "driverMock.lastPayout ? formatCurrency(driverMock.lastPayout) : '-'"
                }
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                // size="sm"
                onClick={() => alert('Enviar notificação')}
              >
                Notificar
              </Button>
              <Button
                // size="sm"
                onClick={() => alert('Bloquear motorista')}
              >
                Bloquear
              </Button>
            </div>
          </div> */}

          {/* Documents */}
          <div className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Documentos principais
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex flex-row items-center justify-start gap-2">
                Carta de condução:{' '}
                {docDriverLicense ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Validado
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400">
                    ⏳ Pendente
                  </span>
                )}
              </div>
              <div className="flex flex-row items-center justify-start gap-2">
                BI Frente:{' '}
                {docIdFront ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Validado
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400">
                    ⏳ Pendente
                  </span>
                )}
              </div>
              <div className="flex flex-row items-center justify-start gap-2">
                BI verso:{' '}
                {docIdBack ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ Validado
                  </span>
                ) : (
                  <span className="text-orange-600 dark:text-orange-400">
                    ⏳ Pendente
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
