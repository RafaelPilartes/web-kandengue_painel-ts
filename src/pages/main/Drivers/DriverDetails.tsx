import { useEffect, useRef, useState } from 'react'
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
import { mapApiError, missingRequirements, semMarcacao } from '@/helpers/apiError'
import type { MissingRequirement } from '@/core/interfaces/IAdminDriverRepository'
import {
  type DocumentoComValidade,
  estaCaducado,
  fimDoDiaEmLuanda,
  rotuloValidade
} from '@/helpers/documentValidity'
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
import type { DocumentType } from '@/types/document'
import type { UserInterface } from '@/interfaces/IUser'
import type { DocumentEntity } from '@/core/entities/Document'
import { useFileUploadViewModel } from '@/viewModels/FileUploadViewModel'
import { userStatusOptions } from '@/data/selectOption'
import { SelectCustom } from '@/components/selects/SelectCustom'
import { DriverProgressTracker } from '@/components/drivers/DriverProgressTracker'
import { WalletStatement } from '@/components/wallet/WalletStatement'

export function DriverViewPage() {
  const { driverId } = useParams<{ driverId: string }>()
  // const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)

  const {
    fetchDriverById,
    updateDriver,
    addDriverService,
    removeDriverService
  } = useDriversViewModel()
  const { fetchOneWalletByField } = useWalletsViewModel()
  const { fetchAllTransactionsByField } = useTransactionsViewModel()
  const { fetchAllRidesByField, calculateDriverEarnings } = useRidesViewModel()
  const { fetchAllVehiclesByField, reviewVehicle } = useVehiclesViewModel()
  const {
    fetchAllDocumentsByField,
    filterDocsBy,
    createDocument,
    approveDocument,
    rejectDocument
  } = useDocumentsViewModel()
  const { uploadSimple } = useFileUploadViewModel()
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

  /*
   * O que a API disse que falta para um serviço, e as confirmações manuais
   * que o admin já deu. Vive aqui e não numa constante: a lista **vem do
   * servidor** a cada recusa.
   */
  const [requisitosEmFalta, setRequisitosEmFalta] = useState<{
    service: RideType
    missing: MissingRequirement[]
  } | null>(null)
  const [confirmacoesDadas, setConfirmacoesDadas] = useState<string[]>([])

  /*
   * A decisão em curso sobre um documento. A folha pede o que o botão não
   * tem: um motivo (na recusa, obrigatório) ou uma data (na aprovação,
   * opcional).
   */
  const [decisaoDocumento, setDecisaoDocumento] = useState<{
    document: DocumentInterface
    decisao: 'approved' | 'rejected'
  } | null>(null)
  const [motivoRecusa, setMotivoRecusa] = useState('')
  const [validadeEscolhida, setValidadeEscolhida] = useState('')
  const [aDecidirDocumento, setADecidirDocumento] = useState(false)
  const [aSubmeterSeguro, setASubmeterSeguro] = useState(false)
  const inputSeguroRef = useRef<HTMLInputElement | null>(null)

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

  /**
   * Os serviços que o motorista está aprovado a fazer — **pela API** (3.7).
   *
   * ⚠️ **Deixou de ser uma escrita a `drivers.services`.** Era-o, pelo SDK
   * cliente, com a verificação dos requisitos neste ecrã — e um ecrã não é
   * uma garantia: quem abrisse a consola do browser aprovava-se a si mesmo
   * para `moto_taxi` sem seguro, sem capacete e sem carta. Agora quem
   * verifica é o servidor, e cada decisão deixa uma linha em `auditLogs`.
   *
   * ⚠️ **E o painel não sabe quais são os requisitos — nem deve.** Quando a
   * API recusa, ela diz **o que falta**; este ecrã mostra essa lista e, se o
   * que falta for uma confirmação manual (o capacete extra), oferece a caixa
   * para o admin a dar e repete o pedido. A tabela vive na lib e é avaliada
   * no servidor: duplicá-la aqui era voltar a ter duas versões da mesma
   * regra, que é o que esta sub-fase veio acabar.
   */
  const handleToggleService = async (
    service: RideType,
    confirmations: string[] = []
  ) => {
    if (!rowDataDriver) return
    const id = rowDataDriver.id as string
    const aRetirar = (rowDataDriver.services ?? []).includes(service)

    try {
      setUpdatingServices(true)
      const result = aRetirar
        ? await removeDriverService.mutateAsync({ driverId: id, service })
        : await addDriverService.mutateAsync({
            driverId: id,
            service,
            confirmations
          })

      setRowDataDriver({ ...rowDataDriver, services: result.services })
      setRequisitosEmFalta(null)
      setConfirmacoesDadas([])
      showToast(
        'success',
        result.changed
          ? `Serviços aprovados: ${
              result.services
                .map((s: RideType) => RIDE_TYPE_LABELS[s])
                .join(', ') || 'nenhum'
            }`
          : 'Já estava assim — nada mudou.'
      )
    } catch (error) {
      console.error(error)
      const emFalta = missingRequirements(error)
      if (emFalta.length > 0) {
        /*
         * A recusa é informação, não um erro a esconder: o admin precisa de
         * saber **o que** falta para o ir resolver (ou confirmar).
         */
        setRequisitosEmFalta({ service, missing: emFalta })
        setConfirmacoesDadas([])
        showToast('info', `Faltam requisitos para ${RIDE_TYPE_LABELS[service]}.`)
      } else {
        showToast(
          'error',
          mapApiError(error, 'Erro ao actualizar os serviços do motorista')
        )
      }
    } finally {
      setUpdatingServices(false)
    }
  }

  /** As chaves manuais que faltam — as únicas que se resolvem daqui. */
  const manuaisEmFalta = (requisitosEmFalta?.missing ?? []).filter(
    r => r.kind === 'manual'
  )
  /** O que o motorista tem de submeter: não se resolve com uma caixa. */
  const naoManuaisEmFalta = (requisitosEmFalta?.missing ?? []).filter(
    r => r.kind !== 'manual'
  )
  const podeConfirmarEAprovar =
    requisitosEmFalta !== null &&
    naoManuaisEmFalta.length === 0 &&
    manuaisEmFalta.length > 0 &&
    manuaisEmFalta.every(r => confirmacoesDadas.includes(r.key))
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
  /**
   * Decidir um documento — **pela API** (3.7), e com duas mudanças de fundo.
   *
   * ⚠️ **A recusa exige motivo.** Este ecrã escrevia `{status: 'rejected'}` e
   * **nunca** `feedback`: o motorista recebia um "rejeitado" sem saber o que
   * corrigir, e voltava a submeter o mesmo documento. O motivo vai para o
   * `feedback`, que é o campo que ele vê.
   *
   * ⚠️ **A aprovação pode levar validade**, gravada como o **fim do dia**
   * escolhido na hora de Luanda: a lib compara instantes, e a meia-noite do
   * dia 31 caducava a apólice no próprio dia 31.
   */
  const handleDecidirDocumento = async () => {
    if (!decisaoDocumento) return
    const { document, decisao } = decisaoDocumento

    if (decisao === 'rejected' && motivoRecusa.trim().length < 5) {
      showToast('error', 'Escreve o motivo: é o que o motorista vê.')
      return
    }

    const expiresAt =
      decisao === 'approved' && validadeEscolhida
        ? fimDoDiaEmLuanda(validadeEscolhida)
        : null
    if (decisao === 'approved' && validadeEscolhida && !expiresAt) {
      showToast('error', 'Essa data não existe no calendário.')
      return
    }

    /*
     * ⚠️ **Uma renovação sem data não renova nada.** Achado pela revisão
     * independente da Fase 4: num documento já aprovado, a API sai pela
     * saída antecipada (`mesmaValidade`) e devolve **200 `changed: false`**,
     * sem escrever nem auditar — e o painel dizia "foi aprovado". O admin
     * ficava convencido de que tinha renovado, e o motorista continuava
     * bloqueado.
     */
    const ehRenovacao =
      decisao === 'approved' && decisaoDocumento.document.status === 'approved'
    if (ehRenovacao && !expiresAt) {
      showToast(
        'error',
        'Escolhe a validade nova: sem data, a renovação não muda nada.'
      )
      return
    }

    const toastId = showToastLoading(
      `${decisao === 'approved' ? 'Aprovando' : 'Rejeitando'} documento`
    )
    try {
      setADecidirDocumento(true)
      const resultado =
        decisao === 'approved'
          ? await approveDocument.mutateAsync({
              id: document.id as string,
              ...(expiresAt ? { expiresAt } : {})
            })
          : await rejectDocument.mutateAsync({
              id: document.id as string,
              reason: motivoRecusa.trim()
            })

      const resultDocument = await fetchAllDocumentsByField('user.id', driverId)
      if (resultDocument?.data) {
        setRowsDataDocuments(resultDocument?.data)
      }

      setDecisaoDocumento(null)
      /*
       * O `changed` da resposta é o que distingue "foi aprovado" de "já estava
       * assim" — e sem ele o painel dizia a primeira coisa nos dois casos.
       */
      updateToast(
        toastId,
        resultado.changed ? 'success' : 'info',
        resultado.changed
          ? `Documento ${getDocumentTypeLabel(document.type)}, foi ${
              decisao === 'approved' ? 'aprovado' : 'rejeitado'
            }`
          : 'Já estava assim — nada mudou.'
      )
    } catch (err) {
      /*
       * `mapApiError` e não `mapFirebaseError`: o erro vem agora da API, com
       * o contrato da 3.1 — e a frase que o admin lê é a `user_message`, não
       * a `message` técnica.
       */
      updateToast(
        toastId,
        'error',
        mapApiError(err, 'Não foi possível decidir o documento.')
      )
    } finally {
      setADecidirDocumento(false)
    }
  }

  /**
   * O que falta para **activar a conta** — que não é o mesmo que aprovar um
   * serviço.
   *
   * ⚠️ **Esta lista é a última cópia de requisitos que vive no painel, e
   * fica por decidir.** Ela não decide serviços (isso é a API, desde a 4.1);
   * decide o `drivers.status = 'active'`, que **é um filtro do dispatch**
   * (`push-notification.service.ts`: `where('status','==','active')`). Ou
   * seja: continua a haver duas versões de "este motorista está pronto", e a
   * mais fraca é a que escolhe quem recebe corridas. Fechá-la é uma rota de
   * admin que ainda não existe — está registado no §0AG.
   *
   * O que **se corrige já** é a parte que contradizia o §0A: um documento
   * aprovado que **caducou** contava como válido aqui. Agora conta como em
   * falta, como em todo o resto do sistema.
   */
  const validateDocumentsBeforeActivation = () => {
    const missing: string[] = []
    const valido = (d: DocumentInterface | null) =>
      !!d && d.status === 'approved' && !estaCaducado(d as DocumentoComValidade)

    if (!valido(docDriverLicense)) missing.push('Carta de condução')
    if (!valido(docIdFront)) missing.push('BI - Frente')
    if (!valido(docIdBack)) missing.push('BI - Verso')

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

  /**
   * O painel submete o **seguro** pelo motorista.
   *
   * ── Porquê, e porque é só este documento ──
   * Medido no clone de produção a 2026-10-14: **zero** documentos
   * `insurance`, e **nenhuma app os escreve** — o tipo existe na lib desde a
   * 2.12.0, mas não há ecrã de submissão na app do motorista. Com a 3.7 em
   * pé, nenhum motorista podia ser aprovado para `moto_taxi`: a rota recusa,
   * e recusa certo. A app ganha o ecrã na Fase 6; até lá o caminho é este, que
   * é como a operação já funciona para o resto (a apólice chega por fora).
   *
   * ⚠️ **Nasce pendente, e é o mesmo caminho de sempre a seguir:** sobe o
   * ficheiro, cria o documento em `pending`, e depois alguém o **aprova**
   * (com validade). Não se cria já aprovado: quem submete e quem decide
   * continuam a ser dois gestos, e é isso que deixa rasto em `auditLogs`.
   *
   * O `user` leva **só o `id`** — é a forma que produção tem (`user: {id:
   * 'dri-…'}` nos 51 documentos lidos) e é para onde o resto do schema está a
   * ir: o §0A tirou o `UserInterface` embutido das `notifications` pela mesma
   * razão.
   */
  const handleSubmeterSeguro = async (file: File) => {
    if (!rowDataDriver) return
    const toastId = showToastLoading('A submeter o seguro')
    try {
      setASubmeterSeguro(true)
      const { url } = await uploadSimple(
        file,
        `documents/${driverId}`,
        `insurance_${file.name}`
      )

      await createDocument.mutateAsync({
        user: { id: driverId } as UserInterface,
        /*
         * ⚠️ **A asserção sai quando o painel subir a lib.** O `'insurance'`
         * entrou no `DocumentType` na 2.12.0 e o painel está fixo na 2.11.0
         * (excepção deliberada, no `CLAUDE.md` da raiz) — sem a asserção isto
         * não compila. A string é a que a lib e a produção usam, verificada
         * contra os requisitos da 3.7; depois da instalação, apaga-se o
         * `as DocumentType` e o compilador volta a cobrar o nome.
         */
        type: 'insurance' as DocumentType,
        url,
        status: 'pending'
      } as Omit<DocumentEntity, 'id'>)

      const resultDocument = await fetchAllDocumentsByField('user.id', driverId)
      if (resultDocument?.data) {
        setRowsDataDocuments(resultDocument?.data)
      }

      updateToast(
        toastId,
        'success',
        'Seguro submetido. Falta aprová-lo, com a validade da apólice.'
      )
    } catch (err) {
      updateToast(toastId, 'error', mapApiError(err, 'Não foi possível submeter o seguro.'))
    } finally {
      setASubmeterSeguro(false)
      if (inputSeguroRef.current) inputSeguroRef.current.value = ''
    }
  }

  const actionsDocument = (doc: DocumentInterface) => {
    const actions = []

    actions.push({
      icon: <Download size={16} />,
      label: 'Abrir',
      onClick: () => handleDownloadDocument(doc)
    })

    const abrirFolha = (decisao: 'approved' | 'rejected') => {
      setMotivoRecusa('')
      setValidadeEscolhida('')
      setDecisaoDocumento({ document: doc, decisao })
    }

    /*
     * ⚠️ **Aprovar deixou de ser só para os pendentes.** Um documento
     * aprovado que **caducou** parece aprovado em qualquer listagem, e a
     * única forma de o renovar daqui é voltar a aprová-lo com validade nova —
     * é o que a API passou a aceitar a 2026-10-14. Sem isto, um seguro
     * caducado só se desbloqueava com uma submissão nova, e para o seguro não
     * há ecrã do motorista que a faça.
     */
    const podeRenovar =
      doc.status === 'approved' && estaCaducado(doc as DocumentoComValidade)

    if (doc.status === 'pending' || podeRenovar) {
      actions.push({
        icon: <Check size={16} />,
        label: podeRenovar ? 'Renovar validade' : 'Aprovar',
        onClick: () => abrirFolha('approved'),
        className:
          'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900'
      })
    }

    if (doc.status === 'pending') {
      actions.push({
        icon: <XIcon size={16} />,
        label: 'Rejeitar',
        onClick: () => abrirFolha('rejected'),
        className:
          'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
      })
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
          O motorista só recebe corridas dos serviços aprovados. Quem verifica
          os requisitos é o servidor — este ecrã mostra o que ele respondeu.
        </p>

        {/*
          O que falta, dito pela API.

          ⚠️ A lista vem da **resposta**, não de uma tabela copiada para aqui:
          os requisitos vivem na lib e são avaliados no servidor. O painel só
          sabe o que a recusa lhe disse — e é isso que impede as duas versões
          da mesma regra que esta sub-fase veio acabar.
        */}
        {requisitosEmFalta && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-900/20">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Falta para {RIDE_TYPE_LABELS[requisitosEmFalta.service]}
              </span>
              <button
                type="button"
                onClick={() => {
                  setRequisitosEmFalta(null)
                  setConfirmacoesDadas([])
                }}
                className="text-xs text-amber-800 underline dark:text-amber-300"
              >
                fechar
              </button>
            </div>

            <ul className="mt-2 flex flex-col gap-2">
              {requisitosEmFalta.missing.map(req => (
                <li key={req.key} className="text-sm">
                  {req.kind === 'manual' ? (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={confirmacoesDadas.includes(req.key)}
                        onChange={e =>
                          setConfirmacoesDadas(anteriores =>
                            e.target.checked
                              ? [...anteriores, req.key]
                              : anteriores.filter(k => k !== req.key)
                          )
                        }
                      />
                      <span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {req.label}
                        </span>
                        <span className="block text-xs text-gray-600 dark:text-gray-400">
                          {semMarcacao(req.detalhe)} — confirmo que o vi
                        </span>
                      </span>
                    </label>
                  ) : (
                    <span className="flex items-start gap-2">
                      <span className="mt-1 text-amber-700 dark:text-amber-300">
                        &bull;
                      </span>
                      <span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {req.label}
                        </span>
                        <span className="block text-xs text-gray-600 dark:text-gray-400">
                          {semMarcacao(req.detalhe)}
                        </span>
                      </span>
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {naoManuaisEmFalta.length > 0 ? (
              <p className="mt-3 text-xs text-amber-900 dark:text-amber-200">
                Isto não se resolve daqui: o motorista tem de submeter o que
                falta — ou carrega-o tu, no separador <strong>Documentos</strong>{' '}
                — e depois aprova-se o documento.
              </p>
            ) : (
              <button
                type="button"
                disabled={!podeConfirmarEAprovar || isUpdatingServices}
                onClick={() =>
                  handleToggleService(
                    requisitosEmFalta.service,
                    confirmacoesDadas
                  )
                }
                className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Confirmar e aprovar
              </button>
            )}
          </div>
        )}
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">
                      Documentos submetidos
                    </h4>

                    {/*
                      ⚠️ **O seguro submete-se daqui, pelo motorista.** Não há
                      ecrã na app dele que o faça (a app ganha-o na Fase 6), e
                      sem o seguro nenhum motorista pode ser aprovado para
                      Moto Táxi. A apólice chega por fora — WhatsApp, papel —
                      e carrega-se aqui.
                    */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputSeguroRef}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) void handleSubmeterSeguro(file)
                        }}
                      />
                      <button
                        type="button"
                        disabled={aSubmeterSeguro}
                        onClick={() => inputSeguroRef.current?.click()}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      >
                        {aSubmeterSeguro
                          ? 'A submeter…'
                          : 'Submeter seguro pelo motorista'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2">Id</th>
                          <th className="px-3 py-2">Tipo</th>
                          <th className="px-3 py-2">Status</th>
                          {/*
                            A validade, que é o que distingue um documento
                            aprovado de um aprovado **caducado** — e um
                            caducado parece aprovado em qualquer listagem.
                          */}
                          <th className="px-3 py-2">Validade</th>
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
                              <td className="px-3 py-2 text-sm">
                                {(() => {
                                  const v = rotuloValidade(
                                    doc as DocumentoComValidade
                                  )
                                  return (
                                    <span
                                      className={
                                        v.caducado
                                          ? 'text-red-600 dark:text-red-400 font-medium'
                                          : 'text-gray-600 dark:text-gray-300'
                                      }
                                    >
                                      {v.texto}
                                    </span>
                                  )
                                })()}
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

      {/*
        A folha da decisão de um documento.

        ⚠️ **Existe porque o botão não chega.** Uma recusa sem motivo deixava
        o motorista a adivinhar — era o que o painel fazia, e o `feedback`
        nunca era escrito. E uma aprovação sem validade deixa um seguro
        **válido para sempre**, que é o oposto do que o `expires_at` existe
        para fazer.
      */}
      {decisaoDocumento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {decisaoDocumento.decisao === 'approved'
                ? 'Aprovar'
                : 'Recusar'}{' '}
              {getDocumentTypeLabel(decisaoDocumento.document.type)}
            </h3>

            {decisaoDocumento.decisao === 'approved' ? (
              <div className="mt-4 flex flex-col gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-200">
                  Validade (opcional)
                </label>
                <input
                  type="date"
                  value={validadeEscolhida}
                  onChange={e => setValidadeEscolhida(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Guarda-se o <strong>fim desse dia</strong>, na hora de Luanda
                  — a apólice cobre o dia inteiro. Deixa vazio se o documento
                  não caduca.
                </p>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2">
                <label className="text-sm text-gray-700 dark:text-gray-200">
                  Motivo (obrigatório)
                </label>
                <textarea
                  value={motivoRecusa}
                  onChange={e => setMotivoRecusa(e.target.value)}
                  rows={3}
                  placeholder="O que é que o motorista tem de corrigir?"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ⚠️ <strong>É isto que o motorista vê</strong> — vai para o
                  `feedback` do documento. Sem motivo, ele volta a submeter o
                  mesmo.
                </p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDecisaoDocumento(null)}
                className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  aDecidirDocumento ||
                  (decisaoDocumento.decisao === 'rejected' &&
                    motivoRecusa.trim().length < 5)
                }
                onClick={handleDecidirDocumento}
                className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  decisaoDocumento.decisao === 'approved'
                    ? 'bg-green-600'
                    : 'bg-red-600'
                }`}
              >
                {decisaoDocumento.decisao === 'approved'
                  ? 'Aprovar'
                  : 'Recusar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
