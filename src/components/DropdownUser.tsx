import { Avatar } from '@/components/ui/avatar'
import { useEffect, useRef, useState, type JSX } from 'react'

interface DropdownUserItem {
  icon?: JSX.Element
  label: string
  onCLick: () => void
}
interface UserInfo {
  photo: string
  name: string
  function: string
}

interface DropdownUserProps {
  user: UserInfo
  options: DropdownUserItem[]
}

export function DropdownUser({ user, options }: DropdownUserProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdownUser = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          id="dropdownInformationButton"
          onClick={toggleDropdownUser}
          className="flex flex-row items-start justify-center gap-0 space-x-4"
        >
          <Avatar src={user.photo} alt={user.name} size="base" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg">
          <div className="py-1 bg-light dark:bg-[#374151] rounded-md shadow-xs">
            {options.map(option => {
              return (
                <button
                  key={option.label}
                  onClick={option.onCLick}
                  className="w-full text-left px-4 py-2 text-xs font-normal flex flex-row items-center justify-start gap-3 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
                >
                  {option.icon}
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
