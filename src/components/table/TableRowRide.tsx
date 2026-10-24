import React from 'react'
import { rideChargeOnScreen } from '@/helpers/fareReview'
import { motion } from 'framer-motion'
import { FiEdit } from 'react-icons/fi'
import { AiFillDelete } from 'react-icons/ai'
import { BadgeSimple } from '../badge/BadgeSimple'
import type { RideInterface } from '../../interfaces/IRide'
import { getRideStatusLabel } from '../../utils/gettersLabels'
import { ActionsMenu } from '../ActionsMenu'
import { Eye } from 'lucide-react'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { colorRideStatusSimple } from '@/utils/colorBy'
import { formatMoney } from '@/utils/number'

interface TableRowProps {
  rowItem: RideInterface
  openPageViewRow?: (id: string) => void
  handleDeleteRow: (action: string) => void
  openModalEditRow: (action: any) => void
}

const TableRow: React.FC<TableRowProps> = ({
  rowItem,
  openPageViewRow,
  openModalEditRow,
  handleDeleteRow
}) => {
  const charge = rideChargeOnScreen(rowItem)

  return (
    <motion.tr
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="border-b dark:border-gray-700 hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-all duration-300 cursor-pointer"
    >
      <td className="px-3 py-3 min-w-[6rem]">
        <p>#{rowItem.id}</p>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-2">
          <div className="relative w-9 h-9 overflow-hidden">
            <img
              className="w-full h-full object-cover rounded-full"
              src={rowItem.user.photo || '/default-avatar.png'}
              alt={rowItem.user.name}
            />
          </div>
          <div className="flex flex-col justify-center items-start">
            <span className="text-dark dark:text-light font-semibold text-sm">
              {rowItem.user.name}
            </span>
            {/*
              ⚠️ O telefone saiu daqui a 2026-10-24: a API deixou de escrever
              `user.phone` na corrida, e o número vive em
              `rides/{id}/private/contacts`. Numa linha de tabela isso custava
              uma leitura por corrida listada — o número está no detalhe, que
              já carrega esse documento.
            */}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-2">
          <div className="relative w-9 h-9 overflow-hidden">
            <img
              className="w-full h-full object-cover rounded-full"
              src={rowItem.driver?.photo || '/default-avatar.png'}
              alt={rowItem.driver?.name || 'Sem motorista'}
            />
          </div>
          <div className="flex flex-col justify-center items-start">
            <span className="text-dark dark:text-light font-semibold text-sm">
              {rowItem.driver ? (
                rowItem.driver.name
              ) : (
                <span className="text-gray-400 dark:text-gray-500 italic font-normal">
                  Sem Motorista
                </span>
              )}
            </span>
            <span className="text-xs">{rowItem.driver?.email || '-'}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <BadgeSimple
          color={colorRideStatusSimple(rowItem.status)}
          label={getRideStatusLabel(rowItem.status)}
        />
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <p>{rowItem.pickup.name}</p>
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <p>{rowItem.dropoff.name}</p>
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <p>{rowItem.distance}</p>
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        {/*
          ⚠️ O `fare` só existe depois do fecho; uma corrida a decorrer
          mostrava 0 AOA. Ver `rideChargeOnScreen`.
        */}
        <p>{formatMoney(charge.total)} AOA</p>
        {charge.provisional && (
          <p className="text-[10px] text-gray-400">a confirmar</p>
        )}
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <p>{formatDateTimeFromFirestore(rowItem.created_at as any).date}</p>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-4">
          <ActionsMenu
            actions={[
              {
                icon: <Eye size={16} />,
                label: 'Ver detalhes',
                onClick: () => openPageViewRow?.(rowItem.id as string)
              },
              {
                icon: <FiEdit size={16} />,
                label: 'Editar',
                onClick: () => openModalEditRow(rowItem)
              },
              {
                icon: <AiFillDelete size={16} />,
                label: 'Excluir',
                onClick: () => handleDeleteRow(rowItem.id as string),
                className:
                  'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
              }
            ]}
          />
        </div>
      </td>
    </motion.tr>
  )
}

export default TableRow
