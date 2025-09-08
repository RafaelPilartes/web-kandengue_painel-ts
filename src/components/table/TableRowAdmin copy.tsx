import React from 'react'
import { motion } from 'framer-motion'
import { FiEdit } from 'react-icons/fi'
import { AiFillDelete } from 'react-icons/ai'
import { BadgeSimple } from '../badge/BadgeSimple'
import { AdminInterface } from '../../interfaces/IAdmin'
import { getStatusLabel, getAdminRoleLabel } from '../../utils/gettersLabels'
import { ActionsMenu } from '../ActionsMenu'
import { Eye } from 'lucide-react'

interface TableRowProps {
  rowItem: AdminInterface
  openPageViewRow?: (id: number) => void
  handleDeleteRow: (action: number) => void
  openModalEditRow: (action: any) => void
}

const TableRow: React.FC<TableRowProps> = ({
  rowItem,
  openPageViewRow,
  openModalEditRow,
  handleDeleteRow
}) => {
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
            <span className="text-xs">{rowItem.user.email}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <p>{getStatusLabel(rowItem.user.status)}</p>
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <p>{getAdminRoleLabel(rowItem.role)}</p>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <BadgeSimple
          color={rowItem.user.status == 'active' ? 'blue' : 'red'}
          label={getStatusLabel(rowItem.user.status)}
        />
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <p>{rowItem.created_at}</p>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-4">
          <ActionsMenu
            actions={[
              {
                icon: <Eye size={16} />,
                label: 'Ver detalhes',
                onClick: () => openPageViewRow?.(rowItem.id as number)
              },
              {
                icon: <FiEdit size={16} />,
                label: 'Editar',
                onClick: () => openModalEditRow(rowItem)
              },
              {
                icon: <AiFillDelete size={16} />,
                label: 'Excluir',
                onClick: () => handleDeleteRow(rowItem.id as number),
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
