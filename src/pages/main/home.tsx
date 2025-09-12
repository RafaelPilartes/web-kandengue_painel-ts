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
import { formatMoney } from '@/utils/number'
import { rideCalculation } from '@/utils/rideCalculation'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'

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

export function Home() {
  const { users, isLoadingUsers } = useUsersViewModel()
  const { drivers, isLoadingDrivers } = useDriversViewModel()
  const { rides, isLoadingRides, calculateCompanyProfit } = useRidesViewModel()
  const { admins } = useAdminsViewModel()

  const companyProfit = calculateCompanyProfit(rides)

  const itemsBreadcrumbs = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Painel Administrativo' }
  ]

  const ridesByMonth = rideCalculation.getRidesByMonth(rides)
  const revenueByMonth = rideCalculation.getRevenueByMonth(rides)
  const ridesByType = rideCalculation.getRidesByType(rides)

  // Localização dos drivers (mock)
  const driverLocations: [number, number][] = [
    [-8.83999, 13.28955],
    [-8.83973, 13.23415],
    [-8.81089, 13.22872]
  ]

  // Top Motoristas (simples: ordena por número de corridas)
  const topDrivers = drivers
    .map(driver => ({
      ...driver,
      rideCount: rides.filter(r => r.driver?.id === driver.id).length
    }))
    .sort((a, b) => b.rideCount - a.rideCount)
    .slice(0, 5)

  // Corridas em andamento
  const activeRides = rides.filter(
    r =>
      r.status !== 'pending' &&
      r.status !== 'accepting_pending' &&
      r.status !== 'completed' &&
      r.status !== 'canceled'
  )

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-x-hidden">
      <Breadcrumbs items={itemsBreadcrumbs} />

      <div>
        {admins.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-lg font-semibold text-dark dark:text-light">
              Administradores
            </span>
            <div className="flex flex-wrap gap-2">
              {admins.map(a => (
                <span
                  key={a.id}
                  className="p-2 rounded-md bg-light dark:bg-dark/50 shadow"
                >
                  {a.email}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estatísticas principais */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-blue-600">
            <Users size={36} className="text-blue-600" />
            <span className="text-base">Total de Usuários</span>
            {isLoadingUsers ? (
              <Spinner size={24} className="text-blue-600 animate-spin" />
            ) : (
              <span className="text-2xl font-semibold">{users.length}</span>
            )}
          </div>

          <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-green-500">
            <Truck size={36} className="text-green-500" />
            <span className="text-base">Total de Motoristas</span>
            {isLoadingDrivers ? (
              <Spinner size={24} className="text-green-500 animate-spin" />
            ) : (
              <span className="text-2xl font-semibold">{drivers.length}</span>
            )}
          </div>

          <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-orange-500">
            <CarFront size={36} className="text-orange-500" />
            <span className="text-base">Total de Corridas</span>
            {isLoadingRides ? (
              <Spinner size={24} className="text-orange-500 animate-spin" />
            ) : (
              <span className="text-2xl font-semibold">{rides.length}</span>
            )}
          </div>

          <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-purple-500">
            <CreditCard size={36} className="text-purple-500" />
            <span className="text-base">Receita Total</span>
            <span className="text-2xl font-semibold">
              AOA {formatMoney(companyProfit)}
            </span>
          </div>
        </div>

        {/* Mapa dos motoristas */}
        <div className="p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
          <h1 className="text-lg font-semibold mb-4">
            Localização dos Motoristas
          </h1>
          <MapContainer
            center={driverLocations[0]}
            zoom={13}
            style={{ height: '300px', width: '100%', zIndex: 0 }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {driverLocations.map((point, index) => (
              <Marker key={index} position={point} icon={customIcon}>
                <Popup>Motorista {index + 1}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Top Motoristas */}
      <div className="p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-4">
          <Crown className="text-yellow-500" /> Top Motoristas
        </h2>
        {isLoadingDrivers || isLoadingRides ? (
          <Spinner size={24} className="text-blue-600 animate-spin" />
        ) : (
          <ul className="flex flex-col gap-2">
            {topDrivers.map((d, i) => (
              <li
                key={d.id}
                className="flex justify-between items-center p-3 rounded-md bg-light dark:bg-dark/50 shadow border-b-2 border-b-yellow-500"
              >
                <span>
                  {i + 1}. {d.name}
                </span>
                <span className="text-sm text-gray-500">
                  {d.rideCount} corridas
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
          <h2>Corridas por Mês</h2>
          <Line data={ridesByMonth} />
        </div>
        <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
          <h2>Receita por Mês</h2>
          <Bar data={revenueByMonth} />
        </div>
      </div>

      {/* Corridas em andamento */}
      <div className="p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-4">
          <Activity className="text-green-600" /> Corridas em Andamento
        </h2>
        {isLoadingRides ? (
          <Spinner size={24} className="text-orange-500 animate-spin" />
        ) : activeRides.length === 0 ? (
          <span className="text-sm text-gray-500">
            Nenhuma corrida em andamento.
          </span>
        ) : (
          <ul className="flex flex-col gap-2">
            {activeRides.map(r => (
              <li
                key={r.id}
                className="flex justify-between items-center p-3 rounded-md bg-light dark:bg-dark/50 shadow"
              >
                <span>
                  Cliente: {r.user.id} → Motorista: {r.driver?.id}
                </span>
                <span className="text-sm text-gray-500">
                  Status: {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Distribuição de Tipos de Corrida */}
      <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
        <h2>Distribuição de Tipos de Corrida</h2>
        <Bar data={ridesByType} />
      </div>
    </div>
  )
}
