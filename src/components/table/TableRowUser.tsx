import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiEdit } from 'react-icons/fi'
import { AiFillDelete } from 'react-icons/ai'
import { BadgeAction } from '../badge/BadgeAction'
import { BadgeSimple } from '../badge/BadgeSimple'
import type { UserInterface } from '../../interfaces/IUser'
import { getUserStatusLabel } from '../../utils/gettersLabels'

interface TableRowProps {
  rowItem: UserInterface
  openModalEditRow: (action: any) => void
  handleDeleteRow: (action: number) => void
}

const TableRowUser: React.FC<TableRowProps> = ({
  rowItem,
  openModalEditRow,
  handleDeleteRow
}) => {
  useEffect(() => {}, [])
  return (
    <motion.tr className="border-b dark:border-gray-700 hover:bg-gray-100/40 dark:hover:bg-gray-700/40 transition-all duration-300 cursor-pointer">
      <td className="px-3 py-3 min-w-[6rem]">
        <p>#{rowItem.id}</p>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-2">
          <div className="relative w-9 h-9 overflow-hidden">
            <img
              className="w-full h-full object-cover rounded-full"
              src={rowItem.photo || '/default-avatar.png'}
              alt={rowItem.name}
            />
          </div>
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
        <BadgeSimple
          color={rowItem.status == 'active' ? 'blue' : 'red'}
          label={getUserStatusLabel(rowItem.status)}
        />
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <p>{rowItem.created_at}</p>
      </td>
      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-4">
          <BadgeAction
            color="green"
            icon={FiEdit}
            onclickBtn={() => openModalEditRow(rowItem)}
          />
          <BadgeAction
            color="red"
            icon={AiFillDelete}
            onclickBtn={() => handleDeleteRow(rowItem.id as number)}
          />
        </div>
      </td>
    </motion.tr>
  )
}

export default TableRowUser
