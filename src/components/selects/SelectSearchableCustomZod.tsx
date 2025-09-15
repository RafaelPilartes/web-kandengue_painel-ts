import { Controller } from 'react-hook-form'
import Select from 'react-select'
import type { StylesConfig } from 'react-select'

interface OptionSelect {
  value: string
  label: string
}

interface SelectSearchableCustomZodProps {
  control?: any // Controlador do react-hook-form
  error?: any // Erros do react-hook-form
  isDisabled?: boolean // Define se o select está desabilitado
  name: string
  label?: string
  defaultValue?: string
  options: OptionSelect[]
  onOptionChange: (value: string) => void
}
export function SelectSearchableCustomZod({
  control,
  error,
  isDisabled = false,
  name,
  label,
  options,
  defaultValue,
  onOptionChange
}: SelectSearchableCustomZodProps) {
  const customStyles: StylesConfig<OptionSelect, false> = {
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
    menu: (base: any) => ({
      ...base,
      color: '#d1d5db', // Cor do texto do menu
      backgroundColor: '#1f2937', // Fundo do menu em modo escuro
      outline: 'none',
      '@media (prefers-color-scheme: dark)': {
        backgroundColor: '#2d3748' // Cor de fundo do menu em modo escuro
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
    })
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

      <Controller
        name={name}
        control={control}
        defaultValue={
          options.find(option => option.value === defaultValue) || ''
        }
        rules={{ required: 'Por favor, preencha este campo!' }}
        render={({ field }) => (
          <Select<OptionSelect, false>
            {...field}
            inputId={name}
            options={options}
            isDisabled={isDisabled}
            classNamePrefix="react-select"
            placeholder="Selecione uma opção"
            isSearchable
            isClearable
            value={
              options.find(option => option.value === field.value) || undefined
            }
            styles={customStyles}
            // className={`p-2.5 text-sm font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700/60 bg-gray-100/10  dark:border-gray-500/60 border-gray-300/60 dark:placeholder-gray-400 dark:text-gray-300 placeholder-gray-600
            //   text-gray-400`}
            // classNames={{
            //   control: ({ isFocused }) =>
            //     `flex items-center bg-gray-700 text-gray-300 focus:outline-none`,
            //   singleValue: () => `dark:text-gray-300 text-gray-400`,
            //   placeholder: () => `text-gray-500`,
            //   menu: () =>
            //     `bg-gray-700 text-gray-300 rounded-lg mt-1 shadow-lg focus:outline-none`,
            //   option: ({ isSelected, isFocused }) =>
            //     `cursor-pointer px-4 py-2 ${
            //       isSelected
            //         ? 'bg-blue-500 text-white'
            //         : isFocused
            //         ? 'bg-gray-600 text-gray-300'
            //         : 'text-gray-300'
            //     } hover:bg-gray-600`,
            //   input: () =>
            //     `text-gray-300 bg-transparent border-none focus:ring-0 focus:outline-none placeholder-gray-500`,
            //   dropdownIndicator: () => `text-gray-500`
            // }}
            onChange={option => {
              field.onChange(option ? option.value : undefined) // Atualiza o react-hook-form com o valor selecionado
              onOptionChange(option ? option.value : '') // Chama o callback
            }}
          />
        )}
      />

      {error && (
        <span className="errorMessage py-1 text-red-600 text-xs">
          {error.message}
        </span>
      )}
    </div>
  )
}
