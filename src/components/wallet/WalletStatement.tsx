import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  COMMISSION_BREAKDOWN_LABELS,
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_SOURCE_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import type { TransactionInterface } from '@/interfaces/ITransaction'
import { formatDateTimeFromFirestore } from '@/utils/date'
import { formatMoney } from '@/utils/number'
import { routsNameMain } from '@/constants/routsName'

/**
 * O extracto da carteira, com os débitos de comissão legíveis.
 *
 * A liquidação escreve `transactions/commission_{rideId}` com um `breakdown`
 * de três parcelas — empresa, fundo de pensões e seguro — e o extracto só
 * mostrava a descrição e o valor. "Taxa de corrida rid-1790… — 850 Kz" não
 * explica nada a um motorista que pergunta porque é que lhe saíram 850; as
 * três parcelas explicam.
 *
 * Mostra também o saldo corrido, de baixo para cima: é a única forma de
 * perceber onde é que um saldo passou a negativo.
 */
export function WalletStatement({
  transactions,
  balance
}: {
  transactions: TransactionInterface[] | null
  /** Saldo actual da carteira, para reconstruir o saldo corrido. */
  balance?: number
}) {
  // Mais recente primeiro, e o saldo corrido calculado de trás para a frente
  // a partir do saldo actual.
  const linhas = useMemo(() => {
    const ordenadas = [...(transactions ?? [])].sort(
      (a, b) =>
        (b.created_at?.getTime?.() ?? 0) - (a.created_at?.getTime?.() ?? 0)
    )

    if (balance === undefined) {
      return ordenadas.map(t => ({ transaction: t, running: null }))
    }

    let corrido = balance
    return ordenadas.map(t => {
      const linha = { transaction: t, running: corrido as number | null }
      // Para trás: desfaz-se o movimento para saber o saldo ANTES dele.
      corrido = t.type === 'credit' ? corrido - t.amount : corrido + t.amount
      return linha
    })
  }, [transactions, balance])

  if (!linhas.length) {
    return (
      <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Nenhum movimento nesta carteira.
      </p>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-3 py-2">Data</th>
            <th className="px-3 py-2">Movimento</th>
            <th className="px-3 py-2 text-right">Valor</th>
            {balance !== undefined && (
              <th className="px-3 py-2 text-right">Saldo depois</th>
            )}
          </tr>
        </thead>
        <tbody>
          {linhas.map(({ transaction, running }) => (
            <Linha
              key={transaction.id}
              transaction={transaction}
              running={running}
              mostraSaldo={balance !== undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Linha({
  transaction,
  running,
  mostraSaldo
}: {
  transaction: TransactionInterface
  running: number | null
  mostraSaldo: boolean
}) {
  const quando = formatDateTimeFromFirestore(transaction.created_at)
  const credito = transaction.type === 'credit'
  const breakdown = transaction.breakdown
  const rideId = transaction.reference_id

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 align-top">
      <td className="px-3 py-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
        {quando.date}
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          {quando.time}
        </span>
      </td>

      <td className="px-3 py-3">
        <span className="font-semibold text-dark dark:text-light">
          {TRANSACTION_CATEGORY_LABELS[transaction.category] ??
            transaction.category}
        </span>

        {/* O `breakdown` é o que torna o débito explicável. */}
        {breakdown && (
          <span className="block mt-1 text-xs text-gray-600 dark:text-gray-300">
            {(['company', 'pension_fund', 'insurance'] as const)
              .map(
                k =>
                  `${COMMISSION_BREAKDOWN_LABELS[k]} ${formatMoney(breakdown[k] ?? 0)}`
              )
              .join('  ·  ')}
          </span>
        )}

        {transaction.source && (
          <span className="block mt-0.5 text-[11px] text-gray-400">
            {TRANSACTION_SOURCE_LABELS[transaction.source] ??
              transaction.source}
          </span>
        )}

        {/* Sem o `breakdown` a descrição é o que há — e é o caso das
            transacções anteriores ao motor de preços. */}
        {!breakdown && transaction.description && (
          <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
            {transaction.description}
          </span>
        )}

        {rideId && transaction.category === 'ride_fee' && (
          <Link
            to={`${routsNameMain.rides.viewStr}${rideId}`}
            className="inline-flex items-center gap-1 mt-1 text-xs text-blue-500 hover:text-blue-400"
          >
            Ver a corrida <ExternalLink size={11} />
          </Link>
        )}
      </td>

      <td
        className={`px-3 py-3 text-right whitespace-nowrap font-bold ${
          credito
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}
      >
        {credito ? '+' : '−'} {formatMoney(transaction.amount)}
      </td>

      {mostraSaldo && (
        <td
          className={`px-3 py-3 text-right whitespace-nowrap ${
            running !== null && running < 0
              ? 'text-red-600 dark:text-red-400 font-semibold'
              : 'text-gray-700 dark:text-gray-200'
          }`}
        >
          {running === null ? '—' : formatMoney(running)}
        </td>
      )}
    </tr>
  )
}
