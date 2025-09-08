import { useEffect, useState } from 'react'

// Icon

import { Breadcrumbs } from '../../components/Breadcrumbs'
// Data
import { routsNameMain } from '../../data/routsName'
// UseStores
import { Building2, ShieldCheck, Stethoscope, Users } from 'lucide-react'
import type { AdminInterface } from '../../interfaces/IAdmin'
import AdminViewModel from '../../services/ViewModel/AdminViewModel'

// Lib
import {
  Bar,
  Line
  // Pie
} from 'react-chartjs-2'
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
import { AdminListsSection } from '../../components/table/AdminListsSection'
// Registrar os componentes do Chart.js
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
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Total data count
  const [rowsDataAdmins, setRowsDataAdmins] = useState<AdminInterface[] | null>(
    null
  )

  const itemsBreadcrumbs = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Painel da Administrativo' }
  ]
  const monthlyAppointments = {
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
        label: 'Agendamentos por mês',
        data: [20, 35, 50, 40, 60, 75, 80, 70, 65, 55, 45, 30],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        tension: 0.4
      }
    ]
  }

  const weekdayAppointments = {
    labels: [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ],
    datasets: [
      {
        label: 'Agendamentos por dia da semana',
        data: [15, 40, 38, 45, 50, 35, 20],
        backgroundColor: '#10B981'
      }
    ]
  }

  // 1. Pagamentos por tipo de serviço
  const paymentData = {
    labels: ['Enfermagem', 'Fisioterapia', 'Cuidadores', 'Psicologia'],
    datasets: [
      {
        label: 'AOA arrecadado',
        data: [520500, 320600, 250900, 155800],
        backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#EF4444']
      }
    ]
  }

  // 2. Solicitações de suporte por tipo/mês
  const supportData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Paciente',
        data: [5, 8, 12, 10, 6, 4],
        backgroundColor: '#3B82F6'
      },
      {
        label: 'Técnico',
        data: [2, 5, 6, 9, 7, 3],
        backgroundColor: '#10B981'
      },
      {
        label: 'Parceiro',
        data: [1, 3, 2, 4, 2, 1],
        backgroundColor: '#F59E0B'
      }
    ]
  }

  // Function
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Executa ambas as requisições em paralelo
        const [rowsDataAdmins] = await Promise.all([
          AdminViewModel.getAllTotal()
        ])

        // Lida com technicians
        if (rowsDataAdmins.error) {
          console.error('Erro ao buscar administradores:', rowsDataAdmins.msg)
        } else {
          setRowsDataAdmins(rowsDataAdmins.data as AdminInterface[])
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="w-full h-full flex flex-col justify-start items-start gap-6 overflow-x-hidden ">
      <Breadcrumbs items={itemsBreadcrumbs} />

      {isLoading}

      <div className="w-full grid grid-cols-4 max-w-s-1030:grid-cols-2 max-w-s-520:grid-cols-1 gap-6">
        {/* Patients */}
        <div className="w-full p-6 flex flex-col justify-start items-start gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-blue-600">
          <span className="text-blue-600 ">
            <Users size={36} />
          </span>
          <span className="font-normal text-base ">Total de pacientes</span>
          <span className="text-3xl font-semibold ">{0}</span>
        </div>

        {/* Technicians */}
        <div className="w-full p-6 flex flex-col justify-start items-start gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-green-500">
          <span className="text-green-500 ">
            <Stethoscope size={36} />
          </span>
          <span className="font-normal text-base ">Total de tecnicos</span>
          <span className="text-3xl font-semibold ">{0}</span>
        </div>

        {/* Partners */}
        <div className="w-full p-6 flex flex-col justify-start items-start gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-orange-500">
          <span className="text-orange-500 ">
            <Building2 size={36} />
          </span>
          <span className="font-normal text-base ">Total de parceiros</span>
          <span className="text-3xl font-semibold ">{0}</span>
        </div>

        {/* Admins */}
        <div className="w-full p-6 flex flex-col justify-start items-start gap-3 rounded-md bg-light dark:bg-dark shadow-3xl border-b-8 border-yellow-400">
          <span className="text-yellow-400 ">
            <ShieldCheck size={36} />
          </span>
          <span className="font-normal text-base ">
            Total de administradores
          </span>
          <span className="text-3xl font-semibold ">
            {rowsDataAdmins?.length}
          </span>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
          <h2>Pagamentos por tipo de serviço</h2>
          <Bar data={paymentData} />
        </div>

        <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
          <h2>Solicitações de suporte por tipo/mês</h2>
          <Bar data={supportData} />
        </div>
      </div>

      <AdminListsSection />

      <div className="w-full flex flex-col gap-8">
        <div className="charts-container grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
            <h2>Agendamentos por mês</h2>
            <Line data={monthlyAppointments} />
          </div>

          <div className="chart p-6 rounded-md bg-light dark:bg-dark shadow-3xl">
            <h2>Agendamentos por dia da semana</h2>
            <Bar data={weekdayAppointments} />
          </div>
        </div>
      </div>
    </div>
  )
}
