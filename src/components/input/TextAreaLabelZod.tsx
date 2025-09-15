import { Controller } from 'react-hook-form'

interface TextAreaLabelProps {
  control?: any // Controlador do react-hook-form
  error?: any // Erros do react-hook-form
  isDisabled?: boolean // Erros do react-hook-form
  htmlFor: string
  label: string
  placeholder: string
  required?: boolean
}

export function TextAreaLabel({
  control,
  error,
  isDisabled = false,
  htmlFor,
  label,
  placeholder,
  required
}: TextAreaLabelProps) {
  return (
    <>
      <div className="w-full">
        <label
          htmlFor={htmlFor}
          className="block mb-2 text-sm font-medium dark:text-light text-gray-400"
        >
          {label}
        </label>
        <Controller
          name={htmlFor}
          disabled={isDisabled}
          control={control}
          rules={{ required: 'Por favor, preencha este campo!' }}
          render={({ field }) => (
            <textarea
              id={htmlFor}
              {...field}
              cols={10}
              value={field.value ?? ''}
              className={`w-full p-2.5 dark:bg-gray-700/60 bg-gray-100/10  dark:border-gray-500/60 border-gray-300/60 dark:placeholder-gray-400 dark:text-gray-300 placeholder-gray-500 text-gray-400 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block`}
              placeholder={placeholder}
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
