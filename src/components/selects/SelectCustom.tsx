import type { ChangeEvent } from 'react'

interface SelectProps {
  padding?: string
  htmlFor?: string
  label?: string
  options: { value: string; label: string }[]
  selectedValue: string | number
  onChange: (value: string) => void
  isLoading?: boolean
}

export function SelectCustom({
  padding,
  htmlFor,
  label,
  options,
  selectedValue,
  onChange,
  isLoading = false
}: SelectProps) {
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = e.target.value
    onChange(selectedOption)
  }

  return (
    <>
      <div className="w-full flex flex-col">
        {label && (
          <div className="w-full">
            {label && (
              <label
                htmlFor={htmlFor}
                className="block mb-2 text-sm font-medium dark:text-light text-gray-400"
              >
                {label}
              </label>
            )}
          </div>
        )}
        {isLoading ? (
          <div className="w-full flex justify-center items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-200" />
          </div>
        ) : (
          <select
            id="countries"
            className={`sm:w-auto p-${
              padding ? padding : '3'
            }  text-xs font-medium text-dark rounded-lg bg-gray-50 border-[1px] border-gray-200 focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
            value={selectedValue}
            onChange={handleSelectChange}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  )
}
