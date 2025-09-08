import React, { useState } from 'react'

interface DropdownBtnProps {
  options: string[]
}

const DropdownBtn: React.FC<DropdownBtnProps> = ({ options }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState('')

  const toggleDropdownBtn = () => {
    setIsOpen(!isOpen)
  }

  const selectOption = (option: string) => {
    setSelectedOption(option)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={toggleDropdownBtn}
          className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          <span>{selectedOption || 'Select an option'}</span>
          <svg
            className="fill-current h-4 w-4 ml-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 14.293a1 1 0 001.414 0l5-5a1 1 0 00-1.414-1.414L10 11.586l-4.293-4.293a1 1 0 10-1.414 1.414l5 5a1 1 0 001.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg">
          <div className="py-1 bg-white rounded-md shadow-xs">
            {options.map(option => (
              <button
                key={option}
                onClick={() => selectOption(option)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 w-full text-left"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DropdownBtn
