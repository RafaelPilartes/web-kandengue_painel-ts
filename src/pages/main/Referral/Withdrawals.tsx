import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Wallet } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { ToastContainer } from 'react-toastify'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import type { WithdrawalStatus } from '@/interfaces/IPromotion'
import { useWithdrawalsViewModel } from '@/viewModels/WithdrawalViewModel'
import { formatMoney } from '@/utils/number'

const STATUS_LABELS: Record<WithdrawalStatus, { label: string; cn: string }> = {
  pending: { label: 'Pendente', cn: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Aprovado', cn: 'bg-blue-100 text-blue-700' },
  rejected: { label: 'Rejeitado', cn: 'bg-red-100 text-red-700' },
  paid: { label: 'Pago', cn: 'bg-green-100 text-green-700' }
}

export function WithdrawalsPage() {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>(
    'all'
  )

  const { withdrawals, isLoading } = useWithdrawalsViewModel(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  )

  const items = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Saques de referência' }
  ]

  return (
    <div className="w-full flex flex-col gap-6">
      <ToastContainer />
      <Breadcrumbs items={items} />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Saques de referência
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pedidos de saque dos ganhos de referência
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <FilterChip
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
          label="Todos"
        />
        {(Object.keys(STATUS_LABELS) as WithdrawalStatus[]).map(s => (
          <FilterChip
            key={s}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            label={STATUS_LABELS[s].label}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size={48} className="animate-spin text-primary-500" />
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Wallet className="mx-auto text-gray-400" size={32} />
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Sem pedidos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3">Utilizador</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Banco</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {withdrawals.map(w => {
                const status = STATUS_LABELS[w.status]
                return (
                  <tr
                    key={w.id}
                    className="text-gray-800 dark:text-gray-200"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {w.user_id.slice(0, 14)}…
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatMoney(w.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      {w.payment_details.bank_name}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {w.created_at.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${status.cn}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`${routsNameMain.referral.withdrawals.viewStr}${w.id}`}
                        className="inline-flex p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Ver detalhe"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
        active
          ? 'bg-primary-100 border-primary-300 text-primary-700'
          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}
