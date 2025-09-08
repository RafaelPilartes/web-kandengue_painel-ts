import { useEffect, useState } from 'react'
import Select from 'react-select'

interface OptionOption {
  value: string
  label: string
}

interface SelectMultiSelectionProps {
  isDisabled?: boolean
  name: string
  label?: string
  defaultValue?: OptionOption[]
  options: OptionOption[]
  onOptionChange: (selected: string[]) => void
  error?: string
}

const SELECT_ALL_OPTION: OptionOption = {
  value: '__all__',
  label: '--- Selecionar todas as opções ---'
}

export function SelectMultiSelection({
  isDisabled = false,
  name,
  label,
  options,
  defaultValue = [],
  onOptionChange,
  error
}: SelectMultiSelectionProps) {
  const [selectedOptions, setSelectedOptions] =
    useState<OptionOption[]>(defaultValue)

  const allOptions = [SELECT_ALL_OPTION, ...options]

  useEffect(() => {
    onOptionChange(selectedOptions.map(opt => opt.value))
  }, [selectedOptions, onOptionChange])

  const handleChange = (selected: readonly OptionOption[] | null) => {
    if (!selected) {
      setSelectedOptions([])
      return
    }

    const selectedArray = [...selected] // torna mutável

    const isSelectAllSelected = selectedArray.some(
      opt => opt.value === SELECT_ALL_OPTION.value
    )

    const allAlreadySelected = selectedArray.length - 1 === options.length

    let finalSelected: OptionOption[]

    if (isSelectAllSelected && !allAlreadySelected) {
      finalSelected = [...options]
    } else if (isSelectAllSelected && allAlreadySelected) {
      finalSelected = []
    } else {
      finalSelected = selectedArray.filter(
        opt => opt.value !== SELECT_ALL_OPTION.value
      )
    }

    setSelectedOptions(finalSelected)
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={name}
          className="block mb-2 text-sm font-medium text-gray-400 dark:text-light"
        >
          {label}
        </label>
      )}

      <Select
        isMulti
        isDisabled={isDisabled}
        options={allOptions}
        value={selectedOptions}
        placeholder="Selecione uma opção"
        onChange={handleChange}
        className="react-select-container"
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: 'rgba(31,41,55,0.4)',
            borderColor: state.isFocused ? '#3b82f6' : '#6b7280',
            boxShadow: 'none',
            minHeight: '42px'
          }),
          multiValue: base => ({
            ...base,
            backgroundColor: '#1f2937'
          }),
          multiValueLabel: base => ({
            ...base,
            color: '#d1d5db'
          }),
          option: (base, { isFocused }) => ({
            ...base,
            backgroundColor: isFocused ? '#374151' : undefined
          }),
          menu: base => ({
            ...base,
            backgroundColor: '#1f2937'
          })
        }}
      />

      {error && (
        <span className="text-xs text-red-500 py-1 block">{error}</span>
      )}
    </div>
  )
}
