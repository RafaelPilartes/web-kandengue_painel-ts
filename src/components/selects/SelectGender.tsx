import React, { useState } from 'react'
import { Controller } from 'react-hook-form'

interface GenderOption {
  id: string
  label: string
}

interface SelectGenderProps {
  control?: any // Controlador do react-hook-form
  error?: any // Erros do react-hook-form
  name: string
  options: GenderOption[]
  onGenderChange: (gender: string) => void
}

export function SelectGender({
  control,
  error,
  name,
  options,
  onGenderChange,
  ...inputProps
}: SelectGenderProps) {
  const [selectedGender, setSelectedGender] = useState<string>('')

  const handleGenderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const gender = event.target.id
    setSelectedGender(gender)
    onGenderChange(gender)
  }

  return (
    <>
      <div className="w-full flex flex-col justify-center items-start">
        <div className="relative w-full flex flex-row justify-start items-center gap-8">
          {options.map(option => (
            <label
              htmlFor={option.id}
              className={`custom-radio py-4 px-6 border rounded-md flex flex-row justify-start items-center gap-4 ${
                selectedGender === option.id
                  ? 'border-primary-200'
                  : 'border-gray-300'
              }`}
              key={option.id}
            >
              <Controller
                name={name}
                control={control}
                rules={{ required: 'Por favor, preencha este campo!' }}
                render={({ field }) => (
                  <input
                    {...field}
                    {...inputProps}
                    type="checkbox"
                    className="custom-control-input text-primary-200 border-gray-300 focus:ring-0 rounded"
                    id={option.id}
                    checked={selectedGender === option.id}
                    onChange={handleGenderChange}
                  />
                )}
              />
              <label className="custom-control-label" htmlFor={option.id}>
                {option.label}
              </label>
            </label>
          ))}
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
