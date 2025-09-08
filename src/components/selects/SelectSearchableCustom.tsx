import { useState } from 'react'
import Select from 'react-select'
import type { StylesConfig } from 'react-select'

interface OptionSelect {
  value: string
  label: string
}

interface SelectSearchableCustomProps {
  isDisabled?: boolean // Define se o select está desabilitado
  name: string
  label?: string
  defaultValue?: string
  options: OptionSelect[]
  onOptionChange: (value: string) => void
  error?: string // Mensagem de erro
}

export function SelectSearchableCustom({
  isDisabled = false,
  name,
  label,
  options,
  defaultValue,
  onOptionChange,
  error
}: SelectSearchableCustomProps) {
  const [selectedOption, setSelectedOption] = useState<OptionSelect | null>(
    options.find(option => option.value === defaultValue) || null
  )

  const customStyles: StylesConfig<OptionSelect, false> = {
    control: (base: any) => ({
      ...base,
      padding: '2px',
      borderRadius: '8px',
      color: '#d1d5db', // Cor do texto digitado
      outline: 'none'
    }),
    menu: (base: any) => ({
      ...base,
      color: '#d1d5db', // Cor do texto do menu
      outline: 'none'
    }),
    input: (base: any) => ({
      ...base,
      color: '#9ca3af', // Cor do texto digitado
      backgroundColor: 'transparent' // Fundo transparente
    }),
    singleValue: (base: any) => ({
      ...base,
      color: '#9ca3af' // Cor do valor selecionado
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af' // Cor do placeholder
    }),
    option: (base: any, state: any) => ({
      ...base,
      padding: '4px 12px',
      borderRadius: '4px 4px 0px 0px',
      backgroundColor: state.isFocused
        ? '#929292' // Cor de fundo quando está em foco/hover
        : 'transparent' // Fundo transparente quando não está em foco
    })
  }

  const handleChange = (option: OptionSelect | null) => {
    setSelectedOption(option)
    onOptionChange(option ? option.value : '')
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block mb-2 text-sm font-medium dark:text-light text-gray-400"
        >
          {label}
        </label>
      )}

      <Select
        inputId={name}
        options={options}
        isDisabled={isDisabled}
        classNamePrefix="react-select"
        placeholder="Selecione"
        isSearchable
        isClearable
        value={selectedOption}
        styles={customStyles}
        onChange={handleChange}
      />

      {error && (
        <span className="errorMessage py-1 text-red-600 text-xs">{error}</span>
      )}
    </div>
  )
}
