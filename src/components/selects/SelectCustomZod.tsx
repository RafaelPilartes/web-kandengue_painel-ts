import { fieldControl, fieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/tailwind-merge'
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
          <label htmlFor={name} className={cn(fieldLabel, 'mb-1.5 block')}>
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
              className={fieldControl}
              onChange={e => {
                field.onChange(e.target.value) // Atualiza o valor do form
                onOptionChange(e.target.value) // Chama a função handleTypeMaterialChange
              }}
            >
              <option
                className="bg-light text-dark dark:bg-baseBgDark dark:text-light"
                value=""
              >
                Selecione uma opção
              </option>
              {options.map((option, index) => (
                <option
                  className="bg-light text-dark dark:bg-baseBgDark dark:text-light"
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
