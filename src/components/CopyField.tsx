import { useState } from 'react'
import { Copy } from 'lucide-react'

interface CopyFieldProps {
  icon?: React.ReactNode
  value: string
}

export function CopyField({ icon, value }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-dark/30">
      {/* Ícone à esquerda */}
      {icon && <span className="text-gray-500">{icon}</span>}

      {/* Texto (email, telefone etc) */}
      <span className="flex-1 text-xs text-gray-700 dark:text-gray-200 truncate">
        {value}
      </span>

      {/* Botão copiar */}
      <button
        onClick={handleCopy}
        className="text-gray-400 hover:text-gray-600 transition"
        title="Copiar"
      >
        <Copy size={16} />
      </button>

      {/* Feedback "copiado" */}
      {copied && (
        <span className="ml-2 text-xs text-green-600 font-medium">
          Copiado!
        </span>
      )}
    </div>
  )
}
