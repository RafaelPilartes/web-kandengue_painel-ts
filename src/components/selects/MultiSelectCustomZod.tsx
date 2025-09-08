import { Controller } from 'react-hook-form'
import Select from 'react-select'

interface OptionOption {
  value: string
  label: string
}

interface MultiSelectCustomZodProps {
  control?: any // Controlador do react-hook-form
  error?: any // Erros do react-hook-form
  isDisabled?: boolean // Se está desabilitado
  name: string
  label?: string
  options: OptionOption[]
  onOptionsChange: (values: string[]) => void
}

export function MultiSelectCustomZod({
  control,
  error,
  isDisabled = false,
  name,
  label,
  options,
  onOptionsChange
}: MultiSelectCustomZodProps) {
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
        defaultValue={[]} // Array vazio para seleção múltipla
        rules={{ required: 'Por favor, preencha este campo!' }}
        render={({ field }) => (
          <Select
            {...field}
            id={name}
            isDisabled={isDisabled}
            options={options}
            isMulti // Habilita seleção múltipla
            className="react-select-container"
            classNamePrefix="react-select"
            onChange={selectedOptions => {
              const values = selectedOptions.map((option: any) => option.value)
              field.onChange(values) // Atualiza o valor no form
              onOptionsChange(values) // Chama a função com os valores selecionados
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
