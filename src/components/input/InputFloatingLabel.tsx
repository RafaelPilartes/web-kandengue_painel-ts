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

export function InputFloatingLabel({
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
        <div className="relative flex flex-row justify-start items-center px-2.5 pb-2 pt-2 w-full rounded-lg appearance-none border dark:bg-gray-700 bg-gray-100/10 dark:border-gray-500/60 border-gray-300/60 ">
          <span>{Icon && <Icon size={18} className="text-primary-200" />}</span>
          <Controller
            name={name}
            control={control}
            rules={{ required: 'Por favor, preencha este campo!' }}
            render={({ field }) => (
              <input
                {...field}
                {...inputProps}
                className={cn(
                  `text-sm w-full ${
                    Icon ? 'ml-2' : 'ml-0'
                  } dark:text-gray-300 text-gray-500 bg-white dark:bg-gray-700 border-none focus:ring-0 outline-none peer`
                )}
                placeholder=" "
              />
            )}
          />
          <span>{IconRight && <IconRight size={18} />}</span>

          <label
            htmlFor={inputProps.id || 'floating_outlined'}
            className={`absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white dark:bg-gray-700 px-2 peer-focus:px-2 peer-focus:text-primary-200 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 ${
              Icon ? 'left-10' : 'left-1'
            } `}
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
