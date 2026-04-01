import { ActionsMenu } from '@/components/ActionsMenu'
import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import type { WalletTopupStatus } from '@/types/enum'
import {
  getWalletTopupStatusLabel,
  getWalletTopupMethodTypeLabel
} from '@/utils/gettersLabels'
import { formatMoney } from '@/utils/number'
import { Check, Wallet } from 'lucide-react'
import { FiX } from 'react-icons/fi'

interface TableRowWalletTopupRequestProps {
  rowItem: WalletTopupRequestInterface
  openPageViewRow?: (item: WalletTopupRequestInterface) => void
  handleApprove: (
    id: string,
    type: WalletTopupStatus,
    item?: WalletTopupRequestInterface
  ) => void
  handleReject: (id: string, type: WalletTopupStatus) => void
}

export default function TableRowWalletTopupRequest({
  rowItem,
  openPageViewRow,
  handleApprove,
  handleReject
}: TableRowWalletTopupRequestProps) {
  return (
    <tr className="border-b dark:border-gray-700">
      <td className="px-3 py-3">{rowItem.id}</td>
      <td className="px-3 py-3 font-semibold">{rowItem.wallet_id}</td>
      <td className="px-3 py-3 font-bold">{formatMoney(rowItem.amount)} AOA</td>
      <td className="px-3 py-3">
        <span
          className={`px-2 py-1 rounded-lg text-xs ${
            rowItem.status === 'approved'
              ? 'bg-green-100 text-green-700'
              : rowItem.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {getWalletTopupStatusLabel(rowItem.status)}
        </span>
      </td>
      <td className="px-3 py-3">
        <span
          className={`px-2 py-1 rounded-lg text-xs ${
            rowItem.method === 'unitel_money'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {getWalletTopupMethodTypeLabel(rowItem.method)}
        </span>
      </td>

      <td className="px-3 py-3 min-w-[6rem]">
        <div className="flex flex-row justify-start items-center gap-4">
          <ActionsMenu
            actions={[
              {
                icon: <Wallet size={16} />,
                label: 'Ver detalhes',
                onClick: () => openPageViewRow?.(rowItem)
              },
              rowItem.status === 'pending' &&
                ({
                  icon: <Check size={16} />,
                  label: 'Aprovar',
                  onClick: () => handleApprove(rowItem.id, 'approved', rowItem),
                  className:
                    'text-red-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900'
                } as any),
              rowItem.status === 'pending' &&
                ({
                  icon: <FiX size={16} />,
                  label: 'Rejeitar',
                  onClick: () => handleReject(rowItem.id, 'rejected'),
                  className:
                    'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900'
                } as any)
            ]}
          />
        </div>
      </td>
    </tr>
  )
}
