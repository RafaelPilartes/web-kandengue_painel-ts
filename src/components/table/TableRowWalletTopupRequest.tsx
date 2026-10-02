import { ActionsMenu } from '@/components/ActionsMenu'
import type { DriverEntity } from '@/core/entities/Driver'
import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import type { WalletTopupStatus } from '@/types/enum'
import { formatDateTimeFromFirestore } from '@/utils/date'
import {
  getWalletTopupStatusLabel,
  getWalletTopupMethodTypeLabel
} from '@/utils/gettersLabels'
import { formatMoney } from '@/utils/number'
import { Check, Wallet } from 'lucide-react'
import { FiX } from 'react-icons/fi'

interface TableRowWalletTopupRequestProps {
  rowItem: WalletTopupRequestInterface
  /**
   * O motorista do pedido, já resolvido pela página. Pode faltar enquanto
   * carrega, ou de vez — há pedidos antigos cujo motorista foi apagado.
   */
  driver?: DriverEntity
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
  driver,
  openPageViewRow,
  handleApprove,
  handleReject
}: TableRowWalletTopupRequestProps) {
  const createdAt = formatDateTimeFromFirestore(rowItem.created_at)

  return (
    <tr className="border-b dark:border-gray-700">
      {/* Motorista: é por quem o admin procura, não pelo id da carteira. O
          id do pedido e da carteira ficam no modal de detalhes. */}
      <td className="px-3 py-3">
        <div className="flex flex-col">
          <span className="font-semibold text-dark dark:text-light">
            {driver?.name ?? '—'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {driver?.phone ?? rowItem.user_id}
          </span>
        </div>
      </td>

      <td className="px-3 py-3 font-bold">{formatMoney(rowItem.amount)} AOA</td>

      {/* Comprovativo: a miniatura chega para decidir se vale a pena abrir. */}
      <td className="px-3 py-3">
        {rowItem.proof_url ? (
          <a
            href={rowItem.proof_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir o comprovativo em tamanho real"
          >
            <img
              src={rowItem.proof_url}
              alt="Comprovativo"
              loading="lazy"
              className="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80"
            />
          </a>
        ) : (
          <span className="text-xs text-gray-400">sem comprovativo</span>
        )}
      </td>

      <td className="px-3 py-3 whitespace-nowrap">
        <div className="flex flex-col">
          <span>{createdAt.date}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {createdAt.time}
          </span>
        </div>
      </td>

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
              // Só os pedidos manuais se revêem aqui. Um da Unitel Money
              // fecha-se pelo callback dela, e a API recusa as duas acções —
              // esconder os botões evita o admin descobrir isso por um erro.
              rowItem.status === 'pending' &&
                rowItem.method !== 'unitel_money' &&
                ({
                  icon: <Check size={16} />,
                  label: 'Confirmar',
                  onClick: () => handleApprove(rowItem.id, 'approved', rowItem),
                  className:
                    'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900'
                } as any),
              rowItem.status === 'pending' &&
                rowItem.method !== 'unitel_money' &&
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
