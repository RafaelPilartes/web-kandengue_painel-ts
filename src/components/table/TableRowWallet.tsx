import { ActionsMenu } from '@/components/ActionsMenu'
import type { WalletInterface } from '@/interfaces/IWallet'
import { getStatusLabel } from '@/utils/gettersLabels'
import { formatMoney } from '@/utils/number'
import { Eye, Wallet } from 'lucide-react'
import { AiFillDelete } from 'react-icons/ai'

interface TableRowWalletProps {
  rowItem: WalletInterface
  openPageViewTransactionsRow?: (item: WalletInterface) => void
  openPageViewWalletRow?: (item: WalletInterface) => void
  handleToggleStatus: (id: string, nextStatus: 'active' | 'inactive') => void
}

export default function TableRowWallet({
  rowItem,
  openPageViewTransactionsRow,
  openPageViewWalletRow,
  handleToggleStatus
}: TableRowWalletProps) {
  return (
    <tr className="border-b dark:border-gray-700">
      <td className="px-3 py-3">{rowItem.id}</td>
      <td className="px-3 py-3 font-semibold">
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
      <td className="px-3 py-3">{rowItem.user.phone}</td>
      <td className="px-3 py-3 text-green-600 font-bold">
        {formatMoney(rowItem.balance)} AOA
      </td>
      <td className="px-3 py-3">
        <span
          className={`px-2 py-1 rounded-lg text-xs ${
            rowItem.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {getStatusLabel(rowItem.status)}
        </span>
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-4">
          <ActionsMenu
            actions={[
              {
                icon: <Wallet size={16} />,
                label: 'Ver transações',
                onClick: () => openPageViewTransactionsRow?.(rowItem)
              },
              {
                icon: <Eye size={16} />,
                label: 'Detalhes',
                onClick: () => openPageViewWalletRow?.(rowItem)
              },
              {
                icon: <AiFillDelete size={16} />,
                label: rowItem.status === 'active' ? 'Desactivar' : 'Reactivar',
                onClick: () =>
                  handleToggleStatus(
                    rowItem.id as string,
                    rowItem.status === 'active' ? 'inactive' : 'active'
                  ),
                className:
                  'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
              }
            ]}
          />
        </div>
      </td>
    </tr>
  )
}
