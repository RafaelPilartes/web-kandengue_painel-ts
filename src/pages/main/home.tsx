// pages/home/Home.tsx
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { routsNameMain } from '../../constants/routsName'
import {
  Users,
  Truck,
  CarFront,
  CreditCard,
  Crown,
  Activity
} from 'lucide-react'
import { Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useUsersViewModel } from '@/viewModels/UserViewModel'
import { useDriversViewModel } from '@/viewModels/DriverViewModel'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import { Spinner } from 'phosphor-react'
import { formatKwanza } from '@/utils/number'
import { rideCalculation } from '@/utils/rideCalculation'
import { useAccess } from '@/hooks/useAccess'
import { useAdminStore } from '@/stores/userStore'
import { Panel } from '@/components/ui/panel'
import { greeting } from './Home/greeting'
import { messageOfTheDay } from './Home/messages'
import { MyWorkPanel } from './Home/MyWorkPanel'

// Registrar chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

const customIcon = new L.Icon({
  iconUrl: '/illustration/moto-marker.png',
  iconSize: [22, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
})

/**
 * The home page: who you are and what you have open, and then — for whoever
 * may see them — the operation's numbers.
 *
 * ⚠️ `/` stopped requiring `view_dashboard` on 2026-10-31. The page is now
 * worth opening without it: an admin with no operational permission still has
 * their own tasks and deadlines here, and being bounced to another screen told
 * them nothing. The NUMBERS still need the permission, and that check moved to
 * where they are drawn.
 */
export function Home() {
  const { can } = useAccess()
  const admin = useAdminStore(s => s.currentAdminData)

  const itemsBreadcrumbs = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Painel Administrativo' }
  ]

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-x-hidden">
      <Breadcrumbs items={itemsBreadcrumbs} />

      <Panel className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-dark dark:text-light">
          {greeting(admin?.name, admin?.gender, new Date())}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {messageOfTheDay(admin?.id)}
        </p>
      </Panel>

      <MyWorkPanel />

      {can('view_dashboard') && <OperationOverview />}
    </div>
  )
}

function OperationOverview() {
  const { users, isLoadingUsers } = useUsersViewModel()
  const { drivers, isLoadingDrivers } = useDriversViewModel()
  const { rides, isLoadingRides, ridesMetrics, calculateCompanyProfit } = useRidesViewModel()

  const companyProfit = calculateCompanyProfit(rides)

  const ridesByMonth = rideCalculation.getRidesByMonth(rides)
  const revenueByMonth = rideCalculation.getRevenueByMonth(rides)
  const ridesByType = rideCalculation.getRidesByType(rides)

  // Top Motoristas (simples: ordena por número de corridas)
  const topDrivers = drivers
    .map(driver => ({
      ...driver,
      rideCount: rides.filter(r => r.driver?.id === driver.id && r.status === 'completed').length
    }))
    .sort((a, b) => b.rideCount - a.rideCount)
    .slice(0, 5)

  // Corridas em andamento
  const activeRides = rides.filter(
    r =>
      r.status !== 'idle' &&
      r.status !== 'pending' &&
      r.status !== 'completed' &&
      r.status !== 'canceled'
  )

  // Localização dos drivers return [number, number]
  const driverLocations: [number, number][] = activeRides
    .map(r => r.driver?.current_location)
    .filter((loc): loc is NonNullable<typeof loc> => !!loc)
    .map(loc => [loc.latitude, loc.longitude])

  const defaultCenter: [number, number] = [-8.839988, 13.289437] // Luanda, Angola

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Estatísticas - Layout Assimétrico */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Corridas - Card Grande (destaque principal) */}
        <div className="lg:col-span-2 p-8 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-orange-500">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CarFront
                  size={28}
                  className="text-orange-600 dark:text-orange-400"
                />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                  Total de Corridas Completas
                </span>
              </div>
              {isLoadingRides ? (
                <Spinner size={32} className="text-orange-600 animate-spin" />
              ) : (
                <div className="text-6xl font-bold text-orange-900 dark:text-orange-100 tracking-tight">
                  {ridesMetrics.completed}
                </div>
              )}
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-2">
                Atividade total do sistema
              </p>
            </div>
            <Activity
              size={48}
              className="text-orange-300 dark:text-orange-700 opacity-40"
            />
          </div>
        </div>

        {/* Receita - Card Destaque */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard
              size={20}
              className="text-amber-600 dark:text-amber-400"
            />
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300 uppercase tracking-wide">
              Receita Total (Completas)
            </span>
          </div>
          {isLoadingRides ? (
            <Spinner size={24} className="text-amber-600 animate-spin" />
          ) : (
            <>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 tracking-tight">
                {formatKwanza(companyProfit)}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                Faturamento da empresa
              </p>
            </>
          )}
        </div>

        {/* Usuários */}
        <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Usuários
            </span>
          </div>
          {isLoadingUsers ? (
            <Spinner size={24} className="text-blue-600 animate-spin" />
          ) : (
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {users.length}
            </div>
          )}
        </div>

        {/* Motoristas */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border-l-4 border-emerald-500">
          <div className="flex items-center gap-2 mb-3">
            <Truck
              size={20}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Motoristas
            </span>
          </div>
          {isLoadingDrivers ? (
            <Spinner size={24} className="text-emerald-600 animate-spin" />
          ) : (
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              {drivers.length}
            </div>
          )}
        </div>
      </div>

      {/* Top Motoristas */}
      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
        <h2 className="flex items-center gap-2 font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
          <Crown className="text-yellow-500" /> Top Motoristas
        </h2>
        {isLoadingDrivers || isLoadingRides ? (
          <div className="flex justify-center py-8">
            <Spinner size={28} className="text-blue-600 animate-spin" />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {topDrivers.map((driver, i) => (
              <li
                key={driver.id}
                className="flex justify-between items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l-4 border-yellow-500"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-bold text-sm">
                    {i + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {driver.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {driver.rideCount} corridas
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Corridas por Mês
          </h3>
          <Line data={ridesByMonth} />
        </div>
        <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Receita por Mês
          </h3>
          <Bar data={revenueByMonth} />
        </div>
      </div>

      {/* Mapa dos motoristas */}
      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Localização dos Motoristas
        </h3>
        <MapContainer
          center={driverLocations.length > 0 ? driverLocations[0] : defaultCenter}
          zoom={13}
          style={{ height: '500px', width: '100%', zIndex: 0 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driverLocations.map((point, index) => (
            <Marker key={index} position={point} icon={customIcon}>
              <Popup>Motorista {index + 1}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Corridas em andamento */}
      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
        <h2 className="flex items-center gap-2 font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
          <Activity className="text-emerald-600" /> Corridas em Andamento
        </h2>
        {isLoadingRides ? (
          <div className="flex justify-center py-8">
            <Spinner size={28} className="text-emerald-600 animate-spin" />
          </div>
        ) : activeRides.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma corrida em andamento no momento.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activeRides.map(r => (
              <li
                key={r.id}
                className="flex justify-between items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-l-4 border-emerald-500"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Cliente: {r.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Motorista: {r.driver?.name || 'N/A'}
                  </p>
                </div>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Distribuição de Tipos de Corrida */}
      <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Distribuição de Tipos de Corrida
        </h3>
        <Bar data={ridesByType} />
      </div>
    </div>
  )
}
