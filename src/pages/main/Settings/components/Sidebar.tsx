// src/components/settings/Sidebar.tsx
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  ChevronRight
} from 'lucide-react'

type SettingsOption = 'tariffs' | 'payouts' | 'general'

interface SidebarProps {
  selectedOption: SettingsOption
  setSelectedOption: (option: SettingsOption) => void
}

export function Sidebar({ selectedOption, setSelectedOption }: SidebarProps) {
  const items = [
    {
      key: 'tariffs',
      label: 'Tarifas',
      icon: LayoutDashboard,
      description: 'Preços e horários'
    },
    {
      key: 'payouts',
      label: 'Pagamentos',
      icon: CreditCard,
      description: 'Taxas e repasses'
    },
    {
      key: 'general',
      label: 'Geral',
      icon: Settings,
      description: 'Preferências do sistema'
    }
  ] as const

  return (
    <aside className="w-72 flex flex-col pt-8 px-6 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-800/50">
      <nav className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-3">
          Menu de Configurações
        </h3>

        {items.map(item => {
          const isActive = selectedOption === item.key
          const Icon = item.icon

          return (
            <button
              key={item.key}
              onClick={() => setSelectedOption(item.key)}
              className={`group flex items-center justify-between p-3 rounded-xl transition-all duration-200 border ${
                isActive
                  ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                  : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 group-hover:shadow-sm'}`}
                >
                  <Icon size={18} />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>
                  <span
                    className={`block text-[10px] ${isActive ? 'text-blue-500/80' : 'text-gray-400'}`}
                  >
                    {item.description}
                  </span>
                </div>
              </div>

              {isActive && <ChevronRight size={16} className="text-blue-500" />}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
