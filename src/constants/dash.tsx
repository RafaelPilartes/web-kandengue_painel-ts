// constants/dash.tsx
import {
  LayoutDashboard,
  Users,
  Truck,
  ClipboardList,
  CreditCard,
  BarChart2,
  Settings,
  ShieldCheck,
  Map,
  CarFront
} from 'lucide-react'
import { routsNameMain } from './routsName'

const dashItem = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard size={16} />,
    to: routsNameMain.dashboard,
    notification: 0,
    accordion: false
  },
  {
    label: 'Usuários',
    icon: <Users size={16} />,
    to: '/',
    subMenus: [
      {
        label: 'Passageiros',
        icon: <Users size={16} />,
        to: routsNameMain.users.passengers.index,
        notification: 0
      },
      {
        label: 'Motoristas',
        icon: <Truck size={16} />,
        to: routsNameMain.users.drivers.index,
        notification: 0
      },
      {
        label: 'Admins & Operadores',
        icon: <ShieldCheck size={16} />,
        to: routsNameMain.users.admins.index,
        notification: 0
      }
    ],
    notification: 0,
    accordion: true
  },
  {
    label: 'Corridas',
    icon: <CarFront size={16} />,
    to: '/',
    subMenus: [
      {
        label: 'Todas as Corridas',
        icon: <ClipboardList size={16} />,
        to: routsNameMain.rides.index,
        notification: 0
      },
      {
        label: 'Monitoramento em Tempo Real',
        icon: <Map size={16} />,
        to: routsNameMain.rides.realtime,
        notification: 0
      },
      {
        label: 'Relatórios de Entregas',
        icon: <BarChart2 size={16} />,
        to: routsNameMain.rides.reports,
        notification: 0
      }
    ],
    notification: 0,
    accordion: true
  },
  {
    label: 'Financeiro',
    icon: <CreditCard size={16} />,
    to: '/',
    subMenus: [
      {
        label: 'Visão Geral Financeira',
        icon: <LayoutDashboard size={16} />,
        to: routsNameMain.finance.index,
        notification: 0
      },
      {
        label: 'Carteira & Transações',
        icon: <CreditCard size={16} />,
        to: routsNameMain.finance.wallet,
        notification: 0
      },
      {
        label: 'Relatórios Financeiros',
        icon: <BarChart2 size={16} />,
        to: routsNameMain.finance.reports.index,
        notification: 0
      }
    ],
    notification: 0,
    accordion: true
  },
  {
    label: 'Notificações',
    icon: <ClipboardList size={16} />,
    to: routsNameMain.notifications.index,
    notification: 0,
    accordion: false
  },

  // Metrics
  {
    label: 'Métricas',
    icon: <BarChart2 size={16} />,
    to: routsNameMain.metrics.index,
    notification: 0,
    accordion: false
  },
  {
    label: 'Configurações',
    icon: <Settings size={16} />,
    to: routsNameMain.settings.index,
    notification: 0,
    accordion: false
  }
]

export default dashItem
