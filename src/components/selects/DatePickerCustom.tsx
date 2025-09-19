import type { ChangeEvent } from 'react'

interface DatePickerProps {
  padding?: string
  htmlFor?: string
  label?: string
  selectedValue: string
  onChange: (value: string) => void
}

export function DatePickerCustom({
  padding,
  htmlFor,
  label,
  selectedValue,
  onChange
}: DatePickerProps) {
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value
    onChange(selectedDate)
  }

  return (
    <div className="w-full flex flex-col">
      {label && (
        <div className="w-full">
          <label
            htmlFor={htmlFor}
            className="block mb-2 text-sm font-medium dark:text-light text-gray-400"
          >
            {label}
          </label>
        </div>
      )}
      <input
        type="date"
        id={htmlFor}
        value={selectedValue}
        onChange={handleDateChange}
        className={`sm:w-auto p-${
          padding ? padding : '3'
        } text-xs font-normal text-dark rounded-lg bg-gray-50 border-[1px] border-gray-200 placeholder focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-dark dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
      />
    </div>
  )
}
