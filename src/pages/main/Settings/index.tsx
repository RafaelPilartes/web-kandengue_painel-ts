import { useEffect, useState, useMemo } from 'react'
import type { PayoutsType, RateType } from '@/types/ride'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import { Sidebar } from './components/Sidebar'
import { TariffSettings } from './components/TariffSettings'
import { PayoutSettings } from './components/PayoutSettings'
import { GeneralSettings } from './components/GeneralSettings'
import { ReferralSettings } from './components/ReferralSettings'
import { useRideRatesViewModel } from '@/viewModels/RideRateViewModel'
import { useRideRatesStore } from '@/stores/rideRatesStore'
import { defaultRates } from '@/utils/rideRatesDefaults'
import { isEqual } from 'lodash' // 👈 para comparar objetos
import { routsNameMain } from '@/constants/routsName'
import { Breadcrumbs } from '@/components/Breadcrumbs'

type SettingsOption = 'tariffs' | 'payouts' | 'general' | 'referral'

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
      case 'referral':
        return <ReferralSettings />
      default:
        return null
    }
  }

  const namePageRides = 'Corridas'
  const namePageReports = 'Relatórios'
  const namePageReportsDetails = 'Relatórios de Corridas'

  const itemsBreadcrumbs = [
    { label: 'Início', to: routsNameMain.home },
    { label: namePageRides, to: routsNameMain.rides.index },
    { label: namePageReports, to: routsNameMain.metrics.index },
    { label: namePageReportsDetails }
  ]

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <Breadcrumbs items={itemsBreadcrumbs} />

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-0 pb-8 backdrop-blur-sm">
          <div className="mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Configurações
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Gerencie as preferências e taxas do sistema
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-4">
              {hasChanges && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    Alterações pendentes
                  </span>
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-black text-white rounded-xl hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
                  >
                    Salvar Alterações
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Container - Layout Limpo */}
        <div className="flex-1 flex overflow-hidden rounded-lg">
          <Sidebar
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
          />

          <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-800 border-l border-l-gray-200 dark:border-l-gray-700">
            <div className="max-w-4xl mx-auto p-8 py-10">{renderContent()}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
