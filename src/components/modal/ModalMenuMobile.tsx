import { routsNameMain } from '../../data/routsName'
import { Link } from 'react-router-dom'
import {
  ArrowDownToLine,
  BarChart2,
  BarChart2Icon,
  BookText,
  Building2,
  CalendarDays,
  ClipboardList,
  Coins,
  CreditCard,
  FileText,
  FolderKanban,
  MessageCircleMore,
  ShieldCheck,
  Stethoscope,
  Users,
  X
} from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'
import { AccordionMenu } from '../accordion/AccordionMenu'
import React from 'react'

interface ModalMenuMobileInterface {
  menuIsVisible: boolean
  setMenuIsVisible: (value: any) => void
}

export function ModalMenuMobile({
  menuIsVisible,
  setMenuIsVisible
}: ModalMenuMobileInterface) {
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
      <React.Fragment key={index}>
        {item.accordion && <AccordionMenu items={item} />}
        {!item.accordion && (
          <Link
            key={index}
            to={item.to}
            className="w-full flex items-start justify-start flex-col border-b-[0.1rem] border-gray-600 cursor-pointer"
          >
            <div className="w-full py-4 px-4 text-white text-left font-light text-sm group transition-all hover:text-primary-200">
              <span className="flex flex-row items-center justify-start gap-1 transition-all duration-300 group-hover:ml-2">
                {item.icon} {item.label}
              </span>
            </div>
          </Link>
        )}
      </React.Fragment>
    )
  })

  const openMenu = () => {
    setMenuIsVisible(!menuIsVisible)
  }

  return (
    <>
      <div
        className={`fixed z-50 top-0 left-0 bg-baseBgDark h-screen w-screen max-w-[20rem] overflow-auto transition-all duration-500 ${
          menuIsVisible && 'left-0'
        }`}
      >
        <div className="relative flex items-start justify-start flex-col gap-4">
          <button
            onClick={openMenu}
            className="absolute right-4 top-4 p-2 bg-primary-200 text-white rounded-md "
          >
            <X />
          </button>

          {/* Logo */}
          <div className="w-full px-4 py-2">
            <img
              src="/logo/logo.png"
              alt="Logo CCI"
              className="w-full max-w-s-xs max-w-[10.6rem] min-w-[8rem] "
            />
          </div>

          {/* List Links */}
          <ul className="w-full flex flex-col ">
            {mapLinks}

            {/* <li className="w-full flex items-start justify-start flex-col border-b-[0.1rem] border-gray-600">
              <a
                href={routsNameMain.registration.students}
                className="w-full py-4 px-4 text-left font-bold text-sm group transition-all hover:text-primary-200"
              >
                <span className="flex flex-row items-center justify-start gap-1 transition-all duration-300 group-hover:ml-2">
                  <HeartPulse size={14} className="z-10" /> Estudantes
                </span>
              </a>
            </li> */}
          </ul>
        </div>
      </div>

      <button
        onClick={openMenu}
        className={`fixed z-20 top-0 bg-gray-950/80 backdrop-blur-[0.2rem] h-screen opacity-0 transition-all duration-300 ${
          menuIsVisible && 'w-screen opacity-100'
        } `}
      />
    </>
  )
}
