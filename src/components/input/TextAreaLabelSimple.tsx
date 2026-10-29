import { fieldControl, fieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/tailwind-merge'
import type { ChangeEvent } from 'react'

interface TextAreaLabelSimpleProps {
  error?: boolean // Erros do react-hook-form
  error_message?: string
  isDisabled?: boolean // Erros do react-hook-form
  value?: string
  htmlFor: string
  label: string
  onChange: (value: string) => void
  placeholder?: string
  defaultValue?: string
  cols?: number
  rows?: number
  required?: boolean
}

export function TextAreaLabelSimple({
  isDisabled = false,
  error = false,
  error_message,
  value,
  htmlFor,
  label,
  placeholder,
  onChange,
  defaultValue,
  cols,
  rows,
  required
}: TextAreaLabelSimpleProps) {
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value
    onChange(inputValue)
  }

  return (
    <>
      <div className="w-full">
        <label htmlFor={htmlFor} className={cn(fieldLabel, 'mb-1.5 block')}>
          {label}
        </label>

        <textarea
          id={htmlFor}
          value={value}
          disabled={isDisabled}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          cols={cols}
          rows={rows}
          className={cn(fieldControl, 'min-h-24')}
        />

        {error && (
          <span className="errorMessage py-1 text-red-600 text-xs font-medium ">
            {error_message}
          </span>
        )}
      </div>
    </>
  )
}
