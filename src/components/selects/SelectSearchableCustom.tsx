import { fieldControl, fieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/tailwind-merge'
import { useState } from 'react'
import Select from 'react-select'
import type { ClassNamesConfig } from 'react-select'

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

  /*
   * Styled with the panel's classes, not react-select's inline styles: those
   * followed prefers-color-scheme, and this panel's theme is a class on the
   * page, so the menu stayed dark in the light theme.
   */
  const classNames: ClassNamesConfig<OptionSelect, false> = {
    control: state =>
      cn(
        fieldControl,
        'flex min-h-10 !py-0.5 cursor-pointer',
        state.isFocused &&
          'border-primary-200 ring-2 ring-primary-200/30 dark:border-primary-200'
      ),
    placeholder: () => 'text-gray-400',
    singleValue: () => 'text-dark dark:text-light',
    input: () => 'text-dark dark:text-light',
    indicatorsContainer: () => 'gap-1 text-gray-500 dark:text-gray-400',
    clearIndicator: () => 'rounded p-0.5 hover:text-dark dark:hover:text-light',
    dropdownIndicator: () => 'p-0.5',
    indicatorSeparator: () => 'my-1 w-px bg-gray-300 dark:bg-gray-600',
    menu: () =>
      'mt-1 overflow-hidden rounded-lg border border-gray-200 bg-light py-1 shadow-lg shadow-gray-900/10 dark:border-gray-600 dark:bg-dark dark:shadow-black/40',
    option: state =>
      cn(
        'cursor-pointer px-3 py-2 text-sm text-dark dark:text-light',
        state.isFocused && 'bg-gray-100 dark:bg-gray-700',
        state.isSelected && 'font-medium text-primary-200 dark:text-primary-100'
      ),
    noOptionsMessage: () => 'px-3 py-2 text-sm text-gray-500 dark:text-gray-400'
  }

  const handleChange = (option: OptionSelect | null) => {
    setSelectedOption(option)
    onOptionChange(option ? option.value : '')
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className={cn(fieldLabel, 'mb-1.5 block')}>
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
        unstyled
        classNames={classNames}
        noOptionsMessage={() => 'Sem resultados'}
        onChange={handleChange}
      />

      {error && (
        <span className="errorMessage py-1 text-red-600 text-xs">{error}</span>
      )}
    </div>
  )
}
