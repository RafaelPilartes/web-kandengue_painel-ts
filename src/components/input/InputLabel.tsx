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
        <label
          htmlFor={htmlFor}
          className="block mb-2 text-sm font-medium dark:text-light text-gray-400 whitespace-nowrap"
        >
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
              className={`w-full p-2.5 border dark:bg-gray-700/60 bg-gray-100/10  dark:border-gray-500/60 border-gray-300/60 dark:text-gray-300 text-gray-400 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block`}
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
