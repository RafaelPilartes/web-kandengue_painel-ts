// pages/home/Home.tsx
import { useEffect, useState } from 'react'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { routsNameMain } from '../../constants/routsName'
import {
  Users,
  Truck,
  ShieldCheck,
  CarFront,
  CreditCard,
  Map
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

export function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const itemsBreadcrumbs = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Painel Administrativo' }
  ]

  // Dados de exemplo (substituir por ViewModel futuramente)
  const stats = {
    passengers: 1200,
    drivers: 340,
    admins: 12,
    rides: 4580,
    revenue: 250000
  }

  const ridesByMonth = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ],
    datasets: [
      {
        label: 'Corridas por mês',
        data: [120, 200, 350, 400, 560, 600, 750, 720, 680, 640, 500, 420],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        tension: 0.4
      }
    ]
  }

  const revenueByMonth = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ],
    datasets: [
      {
        label: 'Receita por mês (AOA)',
        data: [
          15000, 18000, 21000, 25000, 28000, 30000, 35000, 32000, 29000, 27000,
          22000, 20000
        ],
        backgroundColor: '#10B981'
      }
    ]
  }

  const ridesByType = {
    labels: ['Entregas', 'Corridas de carro', 'Corridas de moto'],
    datasets: [
      {
        label: 'Tipos de Corridas',
        data: [3200, 2900, 1480],
        backgroundColor: ['#2563EB', '#F59E0B', '#EF4444']
      }
    ]
  }

  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }, [])

  return (
    <div className="w-full h-full flex flex-col gap-6 overflow-x-hidden">
      <Breadcrumbs items={itemsBreadcrumbs} />

      {isLoading && <span>Carregando...</span>}

      <div className="w-full grid grid-cols-4 max-w-s-1030:grid-cols-2 max-w-s-520:grid-cols-1 gap-6">
        <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-blue-600">
          <Users size={36} className="text-blue-600" />
          <span className="text-base">Total de Usuários</span>
          <span className="text-3xl font-semibold">{stats.passengers}</span>
        </div>

        <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-green-500">
          <Truck size={36} className="text-green-500" />
          <span className="text-base">Total de Motoristas</span>
          <span className="text-3xl font-semibold">{stats.drivers}</span>
        </div>

        <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-orange-500">
          <CarFront size={36} className="text-orange-500" />
          <span className="text-base">Total de Corridas</span>
          <span className="text-3xl font-semibold">{stats.rides}</span>
        </div>

        <div className="p-6 flex flex-col gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-purple-500">
          <CreditCard size={36} className="text-purple-500" />
          <span className="text-base">Receita Total</span>
          <span className="text-3xl font-semibold">
            AOA {stats.revenue.toLocaleString()}
          </span>
        </div>
      </div>

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

      <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
        <h2>Distribuição de Tipos de Corrida</h2>
        <Bar data={ridesByType} />
      </div>
    </div>
  )
}
