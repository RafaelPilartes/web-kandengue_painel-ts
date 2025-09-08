import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

interface InputLabelSimpleProps {
  error?: boolean
  error_message?: string
  isDisabled?: boolean
  type: string
  value?: string
  htmlFor: string
  label: string
  onChange: (value: string) => void
  placeholder?: string
  defaultValue?: string
  required?: boolean
}

export function InputLabelSimple({
  isDisabled = false,
  error = false,
  error_message,
  type,
  value,
  htmlFor,
  label,
  placeholder,
  onChange,
  defaultValue,
  required,
  ...inputProps
}: InputLabelSimpleProps) {
  // Usa defaultValue ou value para inicializar o inputValue
  const [inputValue, setInputValue] = useState<string>(defaultValue || '')

  // Atualiza o valor interno quando o prop 'value' muda
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    } else if (defaultValue !== undefined) {
      setInputValue(defaultValue)
    }
  }, [value, defaultValue])

  // Função para lidar com mudanças no input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  return (
    <div className="w-full">
      <label
        htmlFor={htmlFor}
        className="block mb-2 text-sm font-medium dark:text-light text-gray-600"
      >
        {label}
      </label>
      <input
        type={type}
        id={htmlFor}
        {...inputProps}
        value={inputValue} // Agora controlado apenas pelo inputValue
        disabled={isDisabled}
        onChange={handleInputChange}
        className="w-full p-2.5 border dark:bg-gray-700/60 bg-gray-100/10 dark:border-gray-500/60 border-gray-300/60 dark:text-gray-300 text-gray-500 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block"
        placeholder={placeholder || ''}
        required={required}
      />
      {error && (
        <span className="errorMessage py-1 text-red-600 text-xs font-medium">
          {error_message}
        </span>
      )}
    </div>
  )
}
