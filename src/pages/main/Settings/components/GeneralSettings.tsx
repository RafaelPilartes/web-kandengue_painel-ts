// src/components/settings/GeneralSettings.tsx
import { Moon, Sun, Globe, Bell, Smartphone } from 'lucide-react'
import { useState } from 'react'

export function GeneralSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('pt-AO')
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Preferências Gerais
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Personalize sua experiência no painel administrativo.
      </p>

      <div className="space-y-6">
        {/* Aparência */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Sun size={20} className="text-amber-500" /> Aparência
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Sun
                size={24}
                className={
                  theme === 'light' ? 'text-blue-600' : 'text-gray-400'
                }
              />
              <span
                className={`text-sm font-medium ${theme === 'light' ? 'text-blue-700' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Claro
              </span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Moon
                size={24}
                className={theme === 'dark' ? 'text-blue-600' : 'text-gray-400'}
              />
              <span
                className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-700' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Escuro
              </span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Smartphone
                size={24}
                className={
                  theme === 'system' ? 'text-blue-600' : 'text-gray-400'
                }
              />
              <span
                className={`text-sm font-medium ${theme === 'system' ? 'text-blue-700' : 'text-gray-600 dark:text-gray-400'}`}
              >
                Sistema
              </span>
            </button>
          </div>
        </div>

        {/* Idioma e Região */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Globe size={20} className="text-blue-500" /> Idioma e Região
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Idioma do Painel
              </label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="pt-AO">Português (Angola)</option>
                <option value="en-US">English (US)</option>
                <option value="fr-FR">Français</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notificações */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-red-500" /> Notificações
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Sons de Alerta
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tocar som quando receber novas corridas
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'left-7' : 'left-1'}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
