// src/components/settings/Sidebar.tsx
type SettingsOption = 'tariffs' | 'payouts' | 'general'

interface SidebarProps {
  selectedOption: SettingsOption
  setSelectedOption: (option: SettingsOption) => void
}

export function Sidebar({ selectedOption, setSelectedOption }: SidebarProps) {
  const items = [
    { key: 'tariffs', label: 'Configuração de Tarifa' },
    { key: 'payouts', label: 'Pagamentos' },
    { key: 'general', label: 'Geral' }
  ] as const

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col pt-6">
      <nav className="flex flex-col gap-1 px-2 ">
        {items.map(item => (
          <button
            key={item.key}
            className={`px-4 py-2 rounded-lg text-left transition-colors ${
              selectedOption === item.key
                ? 'bg-primary-200 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setSelectedOption(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
