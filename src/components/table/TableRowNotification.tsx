import React from 'react'
import { motion } from 'framer-motion'
import { AiFillDelete } from 'react-icons/ai'
import { BadgeSimple } from '../badge/BadgeSimple'
import type { NotificationInterface } from '../../interfaces/INotification'
import { ActionsMenu } from '../ActionsMenu'
import { formatDateTimeFromFirestore } from '@/utils/date'
import {
  getNotificationCategoryLabel,
  getNotificationTypeLabel
} from '@/utils/gettersLabels'
import {
  colorNotificationTypeSimple,
  colorNotificationCategorySimple
} from '@/utils/colorBy'

interface TableRowProps {
  rowItem: NotificationInterface
  openPageViewRow?: (id: string) => void
  handleDeleteRow: (id: string) => void
}

const TableRow: React.FC<TableRowProps> = ({ rowItem, handleDeleteRow }) => {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="border-b dark:border-gray-700 hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-all duration-300 cursor-pointer"
    >
      <td className="px-3 py-2">{rowItem.id}</td>
      <td className="px-3 py-2">{rowItem.title}</td>
      <td className="px-3 py-2">{rowItem.message}</td>
      <td className="px-3 py-2">
        <BadgeSimple
          color={colorNotificationTypeSimple(rowItem.type)}
          label={getNotificationTypeLabel(rowItem.type)}
        />
      </td>
      <td className="px-3 py-2">
        <BadgeSimple
          color={colorNotificationCategorySimple(rowItem.category)}
          label={getNotificationCategoryLabel(rowItem.category)}
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
