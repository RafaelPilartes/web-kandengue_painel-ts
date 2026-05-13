import React, { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { useReferralSettingsViewModel } from '@/viewModels/ReferralSettingsViewModel'
import { showToast } from '@/utils/toasts'

export function ReferralSettings() {
  const { settings, minimum, isLoading, updateMinimum, isSubmitting } =
    useReferralSettingsViewModel()

  const [value, setValue] = useState<string>('')

  useEffect(() => {
    setValue(minimum.toString())
  }, [minimum])

  const handleSave = async () => {
    const parsed = Number(value)
    if (Number.isNaN(parsed) || parsed < 0) {
      showToast('error', 'Valor inválido')
      return
    }
    try {
      await updateMinimum(parsed)
      showToast('success', 'Configurações de referência atualizadas')
    } catch (err: any) {
      showToast('error', err.message ?? 'Erro ao atualizar')
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Configurações de referência
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Define o valor mínimo que um utilizador precisa de acumular em
          ganhos pendentes antes de poder solicitar um saque.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Valor mínimo para saque (AOA)
          </label>
          <input
            type="number"
            value={value}
            onChange={e => setValue(e.target.value)}
            min={0}
            disabled={isLoading}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {settings && (
          <p className="text-xs text-gray-400">
            Última atualização:{' '}
            {settings.updated_at.toLocaleString('pt-PT')} por{' '}
            <span className="font-mono">{settings.updated_by}</span>
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <Spinner size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
