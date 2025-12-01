import { useEffect, useState } from 'react'
import {
  useParams
  // useNavigate
} from 'react-router-dom'
import { Spinner, Star } from 'phosphor-react'

// Components do teu projeto (ajusta imports conforme necessário)
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ClipboardList, Mail, MapPin, Phone, Wallet } from 'lucide-react'
import { useUsersViewModel } from '@/viewModels/UserViewModel'
import type { UserInterface } from '@/interfaces/IUser'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import type { RideInterface } from '@/interfaces/IRide'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { formatMoney } from '@/utils/number'
import { Card } from '@/components/ui/card'
import { ToastContainer } from 'react-toastify'
import { getRideStatusLabel } from '@/utils/gettersLabels'

export function UserViewPage() {
  const { clientId } = useParams<{ clientId: string }>()
  // const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)

  const { fetchUserById } = useUsersViewModel()
  const { fetchAllRidesByField, calculatePassengerExpenses } =
    useRidesViewModel()

  // Data
  const [rowDataUser, setRowDataUser] = useState<UserInterface | null>(null)
  const [rowsDataRides, setRowsDataRides] = useState<RideInterface[] | null>(
    null
  )
  const [passengerExpenses, setPassengerExpenses] = useState<number>(0)

  // Function
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      if (!clientId) {
        alert('Não foi fornecido id do motorista')
        return
      }

      try {
        // Executa ambas as requisições em paralelo
        const [dataUser, dataRides] = await Promise.all([
          fetchUserById(clientId),
          fetchAllRidesByField('user.id', clientId, 5000)
        ])

        // Lida com User
        if (!dataUser) {
          console.error('Erro ao buscar motoristas')
        } else {
          setRowDataUser(dataUser)
        }
        // Lida com Rides
        if (!dataRides) {
          console.error('Erro ao buscar corridas')
        } else {
          setRowsDataRides(dataRides.data)
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (rowsDataRides) {
      const earnings = calculatePassengerExpenses(rowsDataRides)
      setPassengerExpenses(earnings)
    }
  }, [rowsDataRides])

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

  if (!rowDataUser) {
    return (
      <div className="p-8 text-center text-sm text-gray-600 dark:text-gray-300">
        Motorista não encontrado.
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <ToastContainer />

      {/* Header */}
      <div className="w-full flex items-center gap-4 border-b border-gray-400 dark:border-gray-600 pb-4 max-w-s-640:flex-col">
        {/* Top */}
        <div className="w-full flex items-center justify-between gap-6 max-w-s-520:flex-col max-w-s-520:gap-4">
          {/* Avatar */}
          <div className="">
            <Avatar
              src={rowDataUser.photo}
              fallback={rowDataUser.name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')}
              alt="User"
              size="xl"
            />
          </div>

          {/* Content */}
          <div className="w-full flex flex-col max-w-s-520:items-center">
            {/* Name */}
            <div className="w-full flex flex-row items-center gap-4 mb-4 max-w-s-640:gap-2 max-w-s-640:flex-col max-w-s-640:items-start max-w-s-640:mb-4 max-w-s-520:items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {rowDataUser.name}
              </h2>

              <div className="flex flex-wrap gap-2 justify-center items-center">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 text-sm">
                  <Star size={14} />{' '}
                  <span className="ml-1 font-medium">{'5.0'}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="w-full text-xs flex flex-row flex-wrap gap-2 max-w-s-520:justify-center text-gray-600 dark:text-gray-300">
              <div className="flex flex-row justify-start items-center gap-1">
                <Phone size={14} /> {rowDataUser.phone}
              </div>
              <span className="hidden text-sm xs:inline">|</span>
              <div className="flex flex-row justify-start items-center gap-1">
                <Mail size={14} /> {rowDataUser.email}
              </div>
              <span className="hidden text-sm xs:inline">|</span>
              <div className="flex flex-row justify-start items-center gap-1">
                <MapPin size={14} /> 775 Rolling Green Rd.
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
            {formatDateTimeFromFirestore(rowDataUser.created_at as any).date}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          title="Total gasto com corridas"
          icon={<Wallet />}
          value={`AOA ${formatMoney(passengerExpenses as number)}`}
        />
        <Card
          title="Corridas Concluídas"
          icon={<ClipboardList />}
          value={`${rowsDataRides?.length}`}
        />
      </div>

      {/* Main content: responsive grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/center: main tabs (span 2 on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-4">
            <Tabs defaultValue="rides">
              <TabsList>
                <TabsTrigger value="rides">Corridas</TabsTrigger>
              </TabsList>

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
                              {formatMoney(ride.fare.total)}
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
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
