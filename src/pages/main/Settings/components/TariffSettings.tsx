// src/components/settings/TariffSettings.tsx
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { RateType } from '@/types/ride'
import { getRideRateLabel } from '@/utils/gettersLabels'
import { Sun, Moon, Clock, Banknote, Ruler, Hourglass } from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'

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
  icon: React.ElementType
  suffix?: string
  prefix?: string
  onRateChange: TariffSettingsProps['onRateChange']
}

function RateField({
  type,
  field,
  value,
  label,
  icon: Icon,
  suffix,
  prefix,
  onRateChange
}: RateFieldProps) {
  const inputId = `${type}-${field}`
  const isNumber = typeof value === 'number'

  return (
    <div className="group">
      <label
        htmlFor={inputId}
        className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5"
      >
        <Icon
          size={14}
          className="text-gray-400 group-focus-within:text-gray-800 transition-colors"
        />
        {label}
      </label>
      <div className="relative">
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
          className={clsx(
            'border rounded-lg px-3 py-2 w-full',
            'text-gray-800 dark:text-gray-100',
            'bg-gray-50 dark:bg-gray-700',
            'border-gray-300 dark:border-gray-600',
            'focus:ring-2 focus:ring-blue-500 outline-none',
            prefix && 'pl-12',
            suffix && 'pr-12'
          )}
        />
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
            {prefix}
          </span>
        )}
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export function TariffSettings({
  rideRates,
  onRateChange
}: TariffSettingsProps) {
  const [activeTab, setActiveTab] = useState<'day_rates' | 'night_rates'>(
    'day_rates'
  )

  const fieldsConfig: Record<
    keyof RateType,
    { icon: React.ElementType; prefix?: string; suffix?: string }
  > = {
    start_time: { icon: Clock },
    end_time: { icon: Clock },
    base_fare: { icon: Banknote, prefix: 'AOA' },
    price_per_km: { icon: Ruler, prefix: 'AOA', suffix: '/ km' },
    wait_time_free_minutes: { icon: Hourglass, suffix: 'min' },
    price_per_minute: { icon: Clock, prefix: 'AOA', suffix: '/ min' }
  }

  const rateFieldsOrder: (keyof RateType)[] = [
    'start_time',
    'end_time',
    'base_fare',
    'price_per_km',
    'wait_time_free_minutes',
    'price_per_minute'
  ]

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Configuração de Tarifas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Defina os preços base e horários de operação.
          </p>
        </div>
      </div>

      {/* TABS STYLING */}
      <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl inline-flex mb-8 border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('day_rates')}
          className={clsx(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            activeTab === 'day_rates'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
          )}
        >
          <Sun
            size={18}
            className={activeTab === 'day_rates' ? 'text-amber-500' : ''}
          />
          Tarifa Diurna
        </button>
        <button
          onClick={() => setActiveTab('night_rates')}
          className={clsx(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            activeTab === 'night_rates'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
          )}
        >
          <Moon
            size={18}
            className={activeTab === 'night_rates' ? 'text-indigo-500' : ''}
          />
          Tarifa Noturna
        </button>
      </div>

      {/* CONTENT */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div
          className={clsx(
            'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-5 pointer-events-none -translate-y-1/2 translate-x-1/2 transition-colors duration-500',
            activeTab === 'day_rates' ? 'bg-amber-500' : 'bg-indigo-500'
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
          {rateFieldsOrder.map(field => (
            <RateField
              key={`${activeTab}-${field}`}
              type={activeTab}
              field={field}
              value={rideRates[activeTab][field]}
              label={getRideRateLabel(field)}
              icon={fieldsConfig[field].icon}
              prefix={fieldsConfig[field].prefix}
              suffix={fieldsConfig[field].suffix}
              onRateChange={onRateChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
