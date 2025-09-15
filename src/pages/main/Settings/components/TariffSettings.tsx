// src/components/settings/TariffSettings.tsx
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { RateType } from '@/types/ride'
import { getRideRateLabel } from '@/utils/gettersLabels'

interface TariffSettingsProps {
  rideRates: RideRatesInterface
  onRateChange: (
    type: 'day_rates' | 'night_rates',
    field: keyof RateType,
    value: string | number
  ) => void
}

interface RateFieldProps {
  type: 'day_rates' | 'night_rates'
  field: keyof RateType
  value: string | number
  label: string
  onRateChange: TariffSettingsProps['onRateChange']
}

function RateField({
  type,
  field,
  value,
  label,
  onRateChange
}: RateFieldProps) {
  const inputId = `${type}-${field}`
  const isNumber = typeof value === 'number'

  return (
    <div className="mb-3">
      <label
        htmlFor={inputId}
        className="block text-sm mb-1 text-gray-600 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={isNumber ? 'number' : 'time'}
        value={value}
        onChange={e =>
          onRateChange(
            type,
            field,
            isNumber ? Number(e.target.value) : e.target.value
          )
        }
        className="border rounded-lg px-3 py-2 w-full 
                   text-gray-800 dark:text-gray-100 
                   bg-gray-50 dark:bg-gray-700 
                   border-gray-300 dark:border-gray-600 
                   focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  )
}

export function TariffSettings({
  rideRates,
  onRateChange
}: TariffSettingsProps) {
  // ordem fixa dos campos
  const rateFieldsOrder: (keyof RateType)[] = [
    'start_time',
    'end_time',
    'base_fare',
    'price_per_km',
    'wait_time_free_minutes',
    'price_per_minute'
  ]

  const renderRateFields = (
    type: 'day_rates' | 'night_rates',
    title: string,
    emoji: string
  ) => (
    <div className="p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
        {emoji} {title}
      </h3>
      {rateFieldsOrder.map(field => (
        <RateField
          key={field}
          type={type}
          field={field}
          value={rideRates[type][field]}
          label={getRideRateLabel(field)}
          onRateChange={onRateChange}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Configuração de Tarifa
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {renderRateFields('day_rates', 'Tarifa Diurna', '🌞')}
        {renderRateFields('night_rates', 'Tarifa Noturna', '🌙')}
      </div>
    </div>
  )
}
