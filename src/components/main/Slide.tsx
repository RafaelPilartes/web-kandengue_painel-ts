import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Building2,
  BookText,
  FolderKanban,
  CalendarDays,
  ClipboardList,
  FileText,
  Coins,
  CreditCard,
  MessageCircleMore,
  ShieldCheck,
  ArrowDownToLine,
  BarChart2,
  BarChart2Icon
} from 'lucide-react'
import AccordionSidBar from '../accordion/AccordionSidBar'
import { routsNameMain } from '../../data/routsName'

export const Slide = () => {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)

  const dash = [
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
          label: 'Todos os Usuários',
          icon: <Users size={16} />,
          to: routsNameMain.users.index,
          notification: 0
        },
        {
          label: 'Pacientes',
          icon: <Users size={16} />,
          to: routsNameMain.patients.index,
          notification: 0
        },
        {
          label: 'Profissionais de Saúde',
          icon: <Stethoscope size={16} />,
          to: routsNameMain.technicians.index,
          notification: 0
        },
        {
          label: 'Admins & Operadores',
          icon: <ShieldCheck size={16} />,
          to: routsNameMain.admins.index,
          notification: 0
        },
        {
          label: 'Parceiros',
          icon: <Building2 size={16} />,
          to: routsNameMain.partners.index,
          notification: 0
        }
      ],
      notification: 0,
      accordion: true
    },
    {
      label: 'Serviços',
      icon: <FolderKanban size={16} />,
      to: '/',
      subMenus: [
        {
          label: 'Categorias',
          icon: <BookText size={16} />,
          to: routsNameMain.services.categories,
          notification: 0
        },
        {
          label: 'Gerenciar Serviços',
          icon: <FolderKanban size={16} />,
          to: routsNameMain.services.index,
          notification: 0
        },
        {
          label: 'Preços por Técnico',
          icon: <Coins size={16} />,
          to: routsNameMain.services.prices,
          notification: 0
        }
      ],
      notification: 0,
      accordion: true
    },
    {
      label: 'Solicitações',
      icon: <ClipboardList size={16} />,
      to: '/',
      subMenus: [
        {
          label: 'Pedidos de Serviço',
          icon: <ClipboardList size={16} />,
          to: routsNameMain.serviceRequests.index,
          notification: 0
        },
        {
          label: 'Atribuições Técnicas',
          icon: <Stethoscope size={16} />,
          to: routsNameMain.serviceRequests.assignments,
          notification: 0
        }
      ],
      notification: 0,
      accordion: true
    },
    {
      label: 'Consultas',
      icon: <CalendarDays size={16} />,
      to: '/',
      subMenus: [
        {
          label: 'Consultas Médicas',
          icon: <CalendarDays size={16} />,
          to: routsNameMain.appointments.index,
          notification: 0
        },
        {
          label: 'Exames',
          icon: <BarChart2Icon size={16} />,
          to: routsNameMain.lab.exams.index,
          notification: 0
        },
        {
          label: 'Prescrições Médicas',
          icon: <FileText size={16} />,
          to: routsNameMain.prescriptions.index,
          notification: 0,
          accordion: false
        }
      ],
      notification: 0,
      accordion: true
    },
    {
      label: 'Financeiro',
      icon: <CreditCard size={16} />,
      to: routsNameMain.finance.index,
      subMenus: [
        {
          label: 'Geral Financeiro',
          icon: <LayoutDashboard size={16} />,
          to: routsNameMain.finance.index,
          notification: 0
        },
        {
          label: 'Pagamentos',
          icon: <Coins size={16} />,
          to: routsNameMain.finance.payments.index,
          notification: 0
        },
        {
          label: 'Assinaturas',
          icon: <CreditCard size={16} />,
          to: routsNameMain.finance.subscriptions.index,
          notification: 0
        },
        {
          label: 'Repasses para Técnicos',
          icon: <ArrowDownToLine size={16} />,
          to: routsNameMain.finance.payouts.index,
          notification: 0
        },
        {
          label: 'Resumo & Relatórios',
          icon: <BarChart2 size={16} />,
          to: routsNameMain.finance.reports.index,
          notification: 0
        }
      ],
      notification: 0,
      accordion: true
    },
    {
      label: 'Suporte',
      icon: <MessageCircleMore size={16} />,
      to: routsNameMain.support.request.index,
      notification: 0,
      accordion: false
    }
  ]

  const mapLinks = dash.map((item, index) => {
    return (
      <div key={index}>
        {item.accordion && (
          <AccordionSidBar
            items={item}
            isActive={activeAccordion === index}
            toggle={() =>
              setActiveAccordion(activeAccordion === index ? null : index)
            }
          />
        )}
        {!item.accordion && (
          <Link
            key={index}
            to={item.to}
            className="py-2 px-3 flex items-center justify-between gap-2 hover:text-primary-200 dark:hover:text-primary-200 rounded-md transition-all duration-200 hover:pl-3"
          >
            <div className="flex flex-row items-center justify-start gap-3 ">
              <span>{item.icon}</span>

              <span className="flex text-sm">{item.label}</span>
            </div>
            {item.notification != 0 && (
              <span className="w-6 h-6 text-black text-xs p-2 flex flex-row items-center justify-center rounded-full bg-blue-200">
                {item.notification}
              </span>
            )}
          </Link>
        )}
      </div>
    )
  })

  return (
    <>
      <nav className={`fixed z-[1] left-0 w-screen group overflow-hidden`}>
        {/* Container */}
        <div
          className={`w-full h-full py-2 bg-light dark:bg-dark flex flex-row items-start justify-center shadow-3xl border-b-[1px] border-gray-200 dark:border-gray-700 flex-wrap gap-y-0 gap-x-0 overflow-y-auto`}
        >
          {/* SLinkContainer */}
          {mapLinks}
        </div>
      </nav>
    </>
  )
}
