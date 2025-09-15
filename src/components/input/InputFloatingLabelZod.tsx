import React from 'react'
import type { ElementType } from 'react'
import { Controller } from 'react-hook-form'
import { cn } from '../../lib/tailwind-merge'

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ElementType
  iconRight?: ElementType
  control?: any // Controlador do react-hook-form
  error?: any // Erros do react-hook-form
  name: string
  label: string
}

export function InputFloatingLabelZod({
  icon: Icon,
  iconRight: IconRight,
  control,
  error,
  name,
  label,
  ...inputProps
}: CustomInputProps) {
  return (
    <>
      <div className="w-full flex flex-col justify-center items-start">
        <div className="relative flex flex-row justify-start items-center border px-2.5 pb-2 pt-2 w-full text-gray-900 dark:text-gray-300 bg-transparent rounded-lg border-gray-300 dark:border-gray-500 appearance-none">
          {Icon && (
            <span className="text-primary-200">
              <Icon size={18} />
            </span>
          )}

          <Controller
            name={name}
            control={control}
            rules={{ required: 'Por favor, preencha este campo!' }}
            render={({ field }) => (
              <input
                {...field}
                {...inputProps}
                value={field.value ?? ''}
                className={cn(
                  `text-sm w-full ${
                    Icon ? 'ml-8' : 'ml-0'
                  } border-none focus:ring-0 outline-none peer dark:bg-gray-700 dark:text-gray-300`
                )}
                placeholder=" "
              />
            )}
          />

          {IconRight && (
            <span>
              <IconRight size={18} />
            </span>
          )}

          <label
            htmlFor={inputProps.id || 'floating_outlined'}
            className={cn(
              `absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white dark:bg-gray-900 px-2 peer-focus:px-2 peer-focus:text-primary-200 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4`,
              { 'left-10': Icon, 'left-1': !Icon }
            )}
          >
            {label}
          </label>
        </div>

        {error && (
          <span className="errorMessage py-1 text-red-600 text-xs">
            {error.message}
          </span>
        )}
      </div>
    </>
  )
}
