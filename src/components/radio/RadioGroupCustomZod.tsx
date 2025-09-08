import { Controller } from 'react-hook-form'

interface OptionOption {
  value: string
  label: string
}

interface RadioGroupCustomZodProps {
  control: any
  name: string
  label?: string
  error?: any
  defaultValue?: string
  options: OptionOption[]
  onOptionChange: (value: string) => void
  isDisabled?: boolean
}

export function RadioGroupCustomZod({
  control,
  name,
  label,
  error,
  defaultValue = '',
  options,
  onOptionChange,
  isDisabled = false
}: RadioGroupCustomZodProps) {
  return (
    <div className="w-full">
      {label && (
        <p className="text-sm font-medium mb-2 dark:text-light text-gray-400">
          {label}
        </p>
      )}
      <Controller
        name={name}
        control={control}
        defaultValue={defaultValue}
        rules={{ required: 'Por favor, selecione uma opção!' }}
        render={({ field }) => (
          <div className="space-y-2">
            {options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center gap-2 text-sm cursor-pointer 
                dark:text-light text-gray-400 
                ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="radio"
                  value={option.value}
                  checked={field.value === option.value}
                  disabled={isDisabled}
                  onChange={e => {
                    field.onChange(e.target.value)
                    onOptionChange(e.target.value)
                  }}
                  className="h-4 w-4 text-blue-600 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      />
      {error && (
        <span className="text-red-500 text-xs py-1 block">{error.message}</span>
      )}
    </div>
  )
}
