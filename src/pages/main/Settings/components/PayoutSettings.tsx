// src/components/settings/PayoutSettings.tsx
import { getRideRateLabel } from '@/utils/gettersLabels'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { PayoutsType } from '@/types/ride'
import { Wallet, Building, PiggyBank, PieChart } from 'lucide-react'

interface PayoutSettingsProps {
  rideRates: RideRatesInterface
  onPayoutChange: (field: keyof PayoutsType, value: number) => void
  setRideRates: React.Dispatch<React.SetStateAction<RideRatesInterface>>
}

interface PayoutSettingsProps {
  rideRates: RideRatesInterface
  onPayoutChange: (field: keyof PayoutsType, value: number) => void
  setRideRates: React.Dispatch<React.SetStateAction<RideRatesInterface>>
}

// Componente visual de barra de distribuição
function DistributionBar({ payouts }: { payouts: PayoutsType }) {
  const total =
    Number(payouts.driver_percent) +
    Number(payouts.company_percent) +
    Number(payouts.pension_fund_percent)

  return (
    <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4 flex items-center gap-2">
        <PieChart size={16} /> Distribuição de Receita
      </h3>

      <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex cursor-pointer hover:opacity-90 transition-opacity">
        <div
          style={{ width: `${payouts.driver_percent}%` }}
          className="h-full bg-blue-500 transition-all duration-500 relative group"
        >
          <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Motorista: {payouts.driver_percent}%
          </div>
        </div>
        <div
          style={{ width: `${payouts.company_percent}%` }}
          className="h-full bg-green-500 transition-all duration-500 relative group"
        >
          <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Empresa: {payouts.company_percent}%
          </div>
        </div>
        <div
          style={{ width: `${payouts.pension_fund_percent}%` }}
          className="h-full bg-purple-500 transition-all duration-500 relative group"
        >
          <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Fundo: {payouts.pension_fund_percent}%
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-4 text-xs font-medium text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500"></span> Motorista (
          {payouts.driver_percent}%)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> Empresa (
          {payouts.company_percent}%)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-500"></span> Fundo (
          {payouts.pension_fund_percent}%)
        </div>
      </div>

      {total !== 100 && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center justify-center font-medium">
          ⚠️ Atenção: A soma das porcentagens é {total}% (deveria ser 100%)
        </div>
      )}
    </div>
  )
}

export function PayoutSettings({
  rideRates,
  onPayoutChange
}: PayoutSettingsProps) {
  // ordem fixa dos campos
  const payoutFieldsOrder: (keyof PayoutsType)[] = [
    'driver_percent',
    'company_percent',
    'pension_fund_percent'
  ]

  // Configuração dos campos
  const payoutConfig: Record<
    keyof PayoutsType,
    { icon: React.ElementType; color: string; description: string }
  > = {
    driver_percent: {
      icon: Wallet,
      color: 'text-blue-500',
      description: 'Porcentagem repassada diretamente ao motorista.'
    },
    company_percent: {
      icon: Building,
      color: 'text-green-500',
      description: 'Taxa retida pela plataforma para operações.'
    },
    pension_fund_percent: {
      icon: PiggyBank,
      color: 'text-purple-500',
      description: 'Contribuição automática para o fundo de segurança.'
    }
  }

  return (
    <div className="bg-transparent animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Configuração de Pagamentos
      </h2>

      <DistributionBar payouts={rideRates.payouts} />

      <div className="grid md:grid-cols-3 gap-6">
        {payoutFieldsOrder.map(field => {
          const config = payoutConfig[field]
          const Icon = config.icon

          return (
            <div
              key={field}
              className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Icon size={64} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700 ${config.color}`}
                  >
                    <Icon size={24} />
                  </div>
                  <label
                    htmlFor={field}
                    className="font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {getRideRateLabel(field)}
                  </label>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 h-8 leading-snug">
                  {config.description}
                </p>

                <div className="relative">
                  <input
                    id={field}
                    type="number"
                    value={rideRates.payouts[field]}
                    onChange={e =>
                      onPayoutChange(field, Number(e.target.value))
                    }
                    className="border rounded-xl px-4 py-3 w-full pr-10
                              text-xl font-bold
                              text-gray-900 dark:text-gray-100 
                              bg-gray-50 dark:bg-gray-700 
                              border-gray-200 dark:border-gray-700 
                              focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    %
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
