import type { ChangeEvent } from 'react'
import { useState, useEffect } from 'react'

interface InputCheckboxProps {
  isDisabled?: boolean // Desabilitar o checkbox se necessário
  value?: boolean // Valor inicial (marcado ou desmarcado)
  htmlFor: string
  label: string
  onChange: (checked: boolean) => void // Função para controle da mudança de estado
}

export function InputCheckbox({
  isDisabled = false,
  value = false, // Valor inicial opcional com valor padrão
  htmlFor,
  label,
  onChange
}: InputCheckboxProps) {
  // Estado interno para controlar o valor do checkbox
  const [isChecked, setIsChecked] = useState<boolean>(value)

  // Atualiza o valor inicial quando ele for passado
  useEffect(() => {
    if (value !== undefined) {
      setIsChecked(value)
    }
  }, [value])

  // Função para lidar com as mudanças no checkbox
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked
    setIsChecked(newChecked) // Atualiza o estado interno
    onChange(newChecked) // Chama o callback passado via props
  }

  return (
    <label
      htmlFor={htmlFor}
      className="relative custom-radio py-2.5 px-2 flex flex-row justify-start items-center gap-4 border dark:bg-gray-700/60 bg-gray-100/10 dark:border-gray-500/60 border-gray-300/60 dark:text-gray-300 text-gray-500 text-sm rounded-lg"
    >
      {label}
      <input
        id={htmlFor}
        type="checkbox"
        checked={isChecked} // Controlado pelo estado interno
        onChange={handleCheckboxChange} // Função de mudança do checkbox
        disabled={isDisabled}
        className="custom-control-input text-primary-200 border-gray-300 focus:ring-0 rounded"
      />
    </label>
  )
}
