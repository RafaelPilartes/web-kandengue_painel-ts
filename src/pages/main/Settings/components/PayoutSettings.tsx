// src/components/settings/PayoutSettings.tsx
import { getRideRateLabel } from '@/utils/gettersLabels'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { PayoutsType } from '@/types/ride'

interface PayoutSettingsProps {
  rideRates: RideRatesInterface
  onPayoutChange: (field: keyof PayoutsType, value: number) => void
  setRideRates: React.Dispatch<React.SetStateAction<RideRatesInterface>>
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Configuração de Pagamentos
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {payoutFieldsOrder.map(field => (
          <div
            key={field}
            className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <label
              htmlFor={field}
              className="block text-sm mb-2 text-gray-600 dark:text-gray-300"
            >
              {getRideRateLabel(field)}
            </label>
            <input
              id={field}
              type="number"
              value={rideRates.payouts[field]}
              onChange={e => onPayoutChange(field, Number(e.target.value))}
              className="border rounded-lg px-3 py-2 w-full 
                         text-gray-800 dark:text-gray-100 
                         bg-gray-50 dark:bg-gray-700 
                         border-gray-300 dark:border-gray-600 
                         focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
