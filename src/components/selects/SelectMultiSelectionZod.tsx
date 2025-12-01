import { Controller } from 'react-hook-form'
import Select from 'react-select'

interface OptionOption {
  value: string
  label: string
}

interface SelectMultiSelectionZodProps {
  control?: any
  error?: any
  isDisabled?: boolean
  name: string
  label?: string
  defaultValue?: OptionOption[]
  options: OptionOption[]
  onOptionChange: (selected: string[]) => void
}

const SELECT_ALL_OPTION: OptionOption = {
  value: '__all__',
  label: '--- Selecionar todas as opções ---'
}

export function SelectMultiSelectionZod({
  control,
  error,
  isDisabled = false,
  name,
  label,
  options,
  defaultValue = [],
  onOptionChange
}: SelectMultiSelectionZodProps) {
  const allOptions = [SELECT_ALL_OPTION, ...options]

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

      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={{ required: 'Por favor, selecione pelo menos uma opção!' }}
        render={({ field }) => {
          const handleChange = (selected: readonly OptionOption[] | null) => {
            if (!selected) {
              field.onChange([])
              onOptionChange([])
              return
            }

            const selectedArray = [...selected] // torna mutável

            const isSelectAllSelected = selectedArray.some(
              opt => opt.value === SELECT_ALL_OPTION.value
            )

            const allAlreadySelected =
              selectedArray.length - 1 === options.length

            let finalSelected: OptionOption[]

            if (isSelectAllSelected && !allAlreadySelected) {
              // Selecionar todas
              finalSelected = [...options]
            } else if (isSelectAllSelected && allAlreadySelected) {
              // Desmarcar tudo
              finalSelected = []
            } else {
              // Seleção manual
              finalSelected = selectedArray.filter(
                opt => opt.value !== SELECT_ALL_OPTION.value
              )
            }

            field.onChange(finalSelected)
            onOptionChange(finalSelected.map(opt => opt.value))
          }

          return (
            <Select
              {...field}
              isMulti
              isDisabled={isDisabled}
              options={allOptions}
              value={field.value}
              placeholder="Selecione uma opção"
              onChange={handleChange}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base: any) => ({
                  ...base,
                  padding: '2px',
                  borderRadius: '8px',
                  color: '#d1d5db', // Cor do texto digitado
                  outline: 'none',
                  backgroundColor: 'transparent', // Fundo transparente no controle
                  borderColor: 'rgba(156, 163, 175, 0.2)', // Cor da borda no modo claro
                  '&:hover': {
                    borderColor: '#a5b4fc' // Quando o controle estiver em foco
                  },
                  '@media (prefers-color-scheme: dark)': {
                    borderColor: '#4b5563' // Cor da borda no modo escuro
                  }
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
                multiValue: base => ({
                  ...base,
                  backgroundColor: '#1f2937'
                }),
                multiValueLabel: base => ({
                  ...base,
                  color: '#d1d5db'
                }),
                option: (base: any, state: any) => ({
                  ...base,
                  padding: '4px 12px',
                  borderRadius: '4px 4px 0px 0px',

                  backgroundColor: state.isFocused
                    ? '#929292' // Cor de fundo quando está em foco/hover
                    : 'transparent', // Fundo transparente quando não está em foco
                  '@media (prefers-color-scheme: dark)': {
                    backgroundColor: state.isFocused ? '#4b5563' : 'transparent' // Foco no modo escuro
                  }
                }),
                menu: (base: any) => ({
                  ...base,
                  color: '#d1d5db', // Cor do texto do menu
                  outline: 'none',
                  backgroundColor: '#1f2937', // Fundo do menu em modo escuro
                  '@media (prefers-color-scheme: dark)': {
                    backgroundColor: '#2d3748' // Cor de fundo do menu em modo escuro
                  }
                })
              }}
            />
          )
        }}
      />

      {error && (
        <span className="text-xs text-red-500 py-1 block">{error.message}</span>
      )}
    </div>
  )
}
