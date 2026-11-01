import React from 'react'
import { motion } from 'framer-motion'
import { FiEdit } from 'react-icons/fi'
import { AiFillDelete } from 'react-icons/ai'
import { BadgeSimple } from '../badge/BadgeSimple'
import type { AdminInterface } from '../../interfaces/IAdmin'
import {
  getAdminRoleLabel,
  getUserStatusLabel
} from '../../utils/gettersLabels'
import { ActionsMenu } from '../ActionsMenu'
import { Eye } from 'lucide-react'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { AdminRow } from '@/modules/Api/rest/adminAccess.dao'

interface TableRowProps {
  rowItem: AdminInterface
  openPageViewRow?: (id: string) => void
  handleDeleteRow: (action: string) => void
  openModalEditRow: (action: any) => void
  /** Department and level come from the API directory, not the Firestore entity. */
  access?: AdminRow
  departmentName?: string
  /** The name of the admin's profile, looked up by the page. */
  profileName?: string
}

const TableRow: React.FC<TableRowProps> = ({
  rowItem,
  openPageViewRow,
  openModalEditRow,
  handleDeleteRow,
  access,
  departmentName,
  profileName
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
          <Avatar src={rowItem.photo} alt={rowItem.name} size="base" />
          <div className="flex flex-col justify-center items-start">
            <span className="text-dark dark:text-light font-semibold text-sm">
              {rowItem.name}
            </span>
            <span className="text-xs">{rowItem.email}</span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <p>{rowItem.phone}</p>
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <p>{departmentName ?? getAdminRoleLabel(rowItem.role)}</p>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        {access?.is_direction ? (
          <Badge tone="brand">Direcção</Badge>
        ) : profileName ? (
          <Badge tone="neutral">{profileName}</Badge>
        ) : (
          <Badge tone="warning">Sem perfil</Badge>
        )}
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <BadgeSimple
          color={
            rowItem.status == 'active'
              ? 'blue'
              : rowItem.status == 'inactive'
                ? 'yellow'
                : 'red'
          }
          label={getUserStatusLabel(rowItem.status)}
        />
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
