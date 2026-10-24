import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Info } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { GeneralSettings } from './components/GeneralSettings'
import { ReferralSettings } from './components/ReferralSettings'
import { AppVersionsSettings } from './components/AppVersionsSettings'
import { WalletTopupSettings } from './components/WalletTopupSettings'
import { RegionsSettings } from './components/RegionsSettings'
import type { SettingsOption } from './settingsOptions'
import { routsNameMain } from '@/constants/routsName'
import { Breadcrumbs } from '@/components/Breadcrumbs'

/**
 * ⚠️ **As abas Tarifas e Pagamentos saíram deste ecrã.**
 *
 * Editavam `rideRates`, que é legado: quem fixa preços desde o motor de
 * preços é `pricingProfiles`, em Preços → Perfis, escrito pela API com
 * `version` incrementada e um registo em `pricingAuditLogs`. Nenhuma das duas
 * apps lê `rideRates`, e a regra passou-o a `allow write: if false` — as abas
 * davam um ecrã que falha ao gravar.
 *
 * Com elas foi-se o "Salvar Alterações" do cabeçalho, que só servia para
 * gravar `rideRates`: as quatro secções que ficam têm cada uma o seu botão.
 */
export function SettingsPage() {
  const [selectedOption, setSelectedOption] =
    useState<SettingsOption>('general')

  const renderContent = () => {
    switch (selectedOption) {
      case 'general':
        return <GeneralSettings />
      case 'referral':
        return <ReferralSettings />
      case 'appVersions':
        return <AppVersionsSettings />
      case 'walletTopup':
        return <WalletTopupSettings />
      case 'regions':
        return <RegionsSettings />
      default:
        return null
    }
  }

  const itemsBreadcrumbs = [
    { label: 'Início', to: routsNameMain.home },
    { label: 'Configurações' }
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
                Gerencie as preferências do sistema
              </p>
            </div>
          </div>
        </div>

        {/* Onde foram os preços — quem vier aqui procurá-los é aqui que olha */}
        <div className="mb-6 p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
          <div className="flex flex-row items-start gap-2">
            <Info
              size={16}
              className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-dark dark:text-light">
                As tarifas e a repartição mudaram de sítio
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Os preços por corrida e veículo, a repartição do motorista, da
                empresa e do fundo, e os acréscimos vivem agora em{' '}
                <strong>Preços → Perfis</strong>. Cada alteração sobe a versão
                do perfil e fica registada.
              </span>
              <Link
                to={routsNameMain.pricing.profiles}
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                Ir para Preços → Perfis
                <ArrowRight size={13} />
              </Link>
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
