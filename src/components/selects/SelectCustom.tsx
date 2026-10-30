import { fieldControl, fieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/tailwind-merge'
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
                className={cn(fieldLabel, 'mb-1.5 block')}
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
            className={cn(
              fieldControl,
              'sm:w-auto',
              padding === '1' && 'py-1',
              padding === '2' && 'py-1.5'
            )}
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
