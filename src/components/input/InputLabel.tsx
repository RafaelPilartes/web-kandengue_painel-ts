import { fieldControl, fieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/tailwind-merge'
import { Controller } from 'react-hook-form'

interface CustomInputProps {
  control?: any // Controlador do react-hook-form
  error?: any // Erros do react-hook-form
  isDisabled?: boolean // Erros do react-hook-form
  type: string
  htmlFor: string
  label: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
}

export function CustomInput({
  control,
  error,
  isDisabled = false,
  type,
  htmlFor,
  label,
  defaultValue,
  placeholder,
  required
}: CustomInputProps) {
  return (
    <>
      <div className="w-full">
        <label htmlFor={htmlFor} className={cn(fieldLabel, 'mb-1.5 block')}>
          {label}
        </label>
        <Controller
          name={htmlFor}
          control={control}
          defaultValue=""
          rules={{ required: 'Por favor, preencha este campo!' }}
          render={({ field }) => (
            <input
              type={type}
              defaultValue={defaultValue}
              disabled={isDisabled}
              id={htmlFor}
              {...field}
              className={fieldControl}
              placeholder={placeholder ? placeholder : ''}
              required={required}
            />
          )}
        />

        {error && (
          <span className="errorMessage py-1 text-red-600 text-xs font-medium ">
            {error.message}
          </span>
        )}
      </div>
    </>
  )
}
