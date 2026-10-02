import { Spinner } from 'phosphor-react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RotateCcw, Wallet } from 'lucide-react'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BadgeSimple } from '@/components/badge/BadgeSimple'
import { useLowBalanceViewModel } from '@/viewModels/LowBalanceViewModel'
import { formatMoney } from '@/utils/number'
import { routsNameMain } from '@/constants/routsName'

/**
 * Quem está abaixo do mínimo de dispatch — e por isso **não recebe corridas**.
 *
 * `wallets.balance >= DRIVER_MIN_WALLET_BALANCE` é um dos filtros do
 * `dispatch.ts`, ao lado da viatura validada e dos serviços aprovados. Era o
 * único dos três sem nenhum ecrã: descobria-se que um motorista estava parado
 * perguntando-lhe.
 */
export function BalancesPage() {
  const { emFalta, negativas, somaEmFalta, total, minimo, isLoading, refetch } =
    useLowBalanceViewModel()

  const itemsBreadcrumbs = [
    { label: 'Início', to: '/' },
    { label: 'Saldos abaixo do mínimo' }
  ]

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-dark dark:text-light">
            Saldos abaixo do mínimo
          </h1>
          <Breadcrumbs items={itemsBreadcrumbs} />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          O mínimo para receber corridas é{' '}
          <strong>{formatMoney(minimo)} Kz</strong>. Quem está abaixo não
          aparece no dispatch, mesmo com viatura validada e serviços aprovados.
        </p>
      </div>

      {isLoading ? (
        <div className="w-full py-16 flex justify-center">
          <Spinner size={28} className="text-primary-200 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Resumo
              label="Abaixo do mínimo"
              value={`${emFalta.length} de ${total}`}
              destaque={emFalta.length > 0}
            />
            <Resumo
              label="Com saldo negativo"
              value={String(negativas)}
              destaque={negativas > 0}
            />
            <Resumo
              label="Falta carregar, ao todo"
              value={`${formatMoney(somaEmFalta)} Kz`}
            />
          </div>

          <div className="w-full p-6 rounded-md bg-light dark:bg-dark flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
              <h2 className="text-lg font-bold text-dark dark:text-light">
                Carteiras
              </h2>
              <button
                type="button"
                onClick={() => refetch()}
                title="Reler"
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {emFalta.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                Nenhum motorista abaixo do mínimo.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs bg-gray-300/40 dark:bg-gray-500/40">
                    <tr>
                      <th className="px-3 py-3">Motorista</th>
                      <th className="px-3 py-3 text-right">Saldo</th>
                      <th className="px-3 py-3 text-right">Falta</th>
                      <th className="px-3 py-3">Carteira</th>
                      <th className="px-3 py-3">Extracto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emFalta.map(({ wallet, falta, negativo }) => {
                      const saldo =
                        typeof wallet.balance === 'number' ? wallet.balance : 0
                      const driverId = wallet.user?.id

                      return (
                        <tr
                          key={wallet.id}
                          className="border-b dark:border-gray-700"
                        >
                          <td className="px-3 py-3">
                            <span className="block font-semibold text-dark dark:text-light">
                              {wallet.user?.name ?? '— sem motorista —'}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {wallet.user?.phone ?? wallet.id}
                            </span>
                          </td>

                          <td
                            className={`px-3 py-3 text-right font-bold whitespace-nowrap ${
                              negativo
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {formatMoney(saldo)} Kz
                            {/* Ausente conta como zero, como no dispatch. */}
                            {typeof wallet.balance !== 'number' && (
                              <span className="block text-[10px] font-normal text-gray-400">
                                sem campo `balance`
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-3 text-right whitespace-nowrap text-gray-700 dark:text-gray-200">
                            {formatMoney(falta)} Kz
                          </td>

                          <td className="px-3 py-3">
                            {negativo ? (
                              <BadgeSimple label="Negativo" color="red" />
                            ) : (
                              <BadgeSimple label="Abaixo" color="orange" />
                            )}
                          </td>

                          <td className="px-3 py-3">
                            {driverId ? (
                              <Link
                                to={`${routsNameMain.users.drivers.viewStr}${driverId}`}
                                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400"
                              >
                                <Wallet size={13} /> Ver extracto
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {negativas > 0 && (
              <div className="flex flex-row items-start gap-2 p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 text-red-600 dark:text-red-400 shrink-0"
                />
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Um saldo negativo é a comissão a ter sido debitada sem haver
                  saldo — a liquidação não tem guarda de saldo, e é de
                  propósito. O motorista precisa de carregar o que falta antes
                  de voltar a receber corridas.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Resumo({
  label,
  value,
  destaque
}: {
  label: string
  value: string
  destaque?: boolean
}) {
  return (
    <div className="p-4 rounded-md bg-light dark:bg-dark flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-2xl font-bold ${
          destaque
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-dark dark:text-light'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
