import { Controller } from 'react-hook-form'

interface OptionOption {
  value: string
  label: string
}

interface SelectCustomZodProps {
  control?: any // Controlador do react-hook-form
  error?: any // Erros do react-hook-form
  isDisabled?: boolean // Erros do react-hook-form
  name: string
  label?: string
  defaultValue?: string
  options: OptionOption[]
  onOptionChange: (text: string) => void
}

export function SelectCustomZod({
  control,
  error,
  isDisabled = false,
  name,
  label,
  options,
  defaultValue,
  onOptionChange,
  ...inputProps
}: SelectCustomZodProps) {
  return (
    <>
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
          defaultValue={defaultValue}
          rules={{ required: 'Por favor, preencha este campo!' }}
          render={({ field }) => (
            <select
              {...field}
              {...inputProps}
              id={name}
              value={field.value ?? ''}
              disabled={isDisabled}
              className={`p-2.5 text-sm font-light rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700/60 bg-gray-100/10  dark:border-gray-500/60 border-gray-300/60 dark:placeholder-gray-400 dark:text-gray-400 placeholder-gray-600
text-gray-400`}
              onChange={e => {
                field.onChange(e.target.value) // Atualiza o valor do form
                onOptionChange(e.target.value) // Chama a função handleTypeMaterialChange
              }}
            >
              <option
                className="dark:bg-gray-700 bg-gray-100 dark:text-gray-300 text-gray-400"
                value=""
              >
                Selecione uma opção
              </option>
              {options.map((option, index) => (
                <option
                  className="dark:bg-gray-700 bg-gray-100 dark:text-gray-300 text-gray-400"
                  key={index}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          )}
        />

        {error && (
          <span className="errorMessage py-1 text-red-600 text-xs">
            {error.message}
          </span>
        )}
      </div>
    </>
  )
}
