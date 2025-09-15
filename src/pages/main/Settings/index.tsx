import { useEffect, useState, useMemo } from 'react'
import type { PayoutsType, RateType } from '@/types/ride'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import { Sidebar } from './components/Sidebar'
import { TariffSettings } from './components/TariffSettings'
import { PayoutSettings } from './components/PayoutSettings'
import { GeneralSettings } from './components/GeneralSettings'
import { useRideRatesViewModel } from '@/viewModels/RideRateViewModel'
import { useRideRatesStore } from '@/stores/rideRatesStore'
import { defaultRates } from '@/utils/rideRatesDefaults'
import { isEqual } from 'lodash' // 👈 para comparar objetos

type SettingsOption = 'tariffs' | 'payouts' | 'general'

export function SettingsPage() {
  const { rideRates, isLoadingRideRates, updateRideRate } =
    useRideRatesViewModel()
  const { addRideRatesData, currentRideRatesData } = useRideRatesStore()

  const [selectedOption, setSelectedOption] =
    useState<SettingsOption>('tariffs')

  const [rideRatesStage, setRideRates] = useState<RideRatesInterface>(
    currentRideRatesData ?? defaultRates
  )

  // Atualiza quando `rideRates` mudar (ex: vindo da API)
  useEffect(() => {
    if (rideRates.length > 0) {
      addRideRatesData(rideRates[0])
      setRideRates(rideRates[0])
    }
  }, [rideRates, addRideRatesData])

  // Detecta se houve mudanças
  const hasChanges = useMemo(() => {
    return !isEqual(rideRatesStage, currentRideRatesData)
  }, [rideRatesStage, currentRideRatesData])

  const handleRateChange = (
    type: 'day_rates' | 'night_rates',
    field: keyof RateType,
    value: string | number
  ) => {
    setRideRates(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
      updated_at: new Date()
    }))
  }

  const handlePayoutChange = (field: keyof PayoutsType, value: number) => {
    setRideRates(prev => ({
      ...prev,
      payouts: { ...prev.payouts, [field]: value },
      updated_at: new Date()
    }))
  }

  const handleSave = () => {
    addRideRatesData(rideRatesStage) // atualiza store
    updateRideRate.mutate({ id: rideRatesStage.id, rideRate: rideRatesStage })
    console.log('Dados salvos:', rideRatesStage)
  }

  const renderContent = () => {
    if (isLoadingRideRates) {
      return <div>Carregando...</div>
    }

    switch (selectedOption) {
      case 'tariffs':
        return (
          <TariffSettings
            rideRates={rideRatesStage}
            onRateChange={handleRateChange}
          />
        )
      case 'payouts':
        return (
          <PayoutSettings
            rideRates={rideRatesStage}
            onPayoutChange={handlePayoutChange}
            setRideRates={setRideRates}
          />
        )
      case 'general':
        return <GeneralSettings />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie as configurações do aplicativo.
          </p>
        </div>

        {/* Botão de salvar */}
        {hasChanges && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
          >
            Salvar alterações
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex">
        <Sidebar
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
        />
        <main className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-800">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
