import { ArrowRight } from 'lucide-react'
import { ElementType, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

interface DropdownInfoItem {
  photo: string
  title: string
  description?: string
  link: string
  date: string
}

interface DropdownInfoProps {
  icon: ElementType
  title: string
  link: string

  options: DropdownInfoItem[]
}

export function DropdownInfo({
  icon: Icon,
  title,
  link,
  options
}: DropdownInfoProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdownInfo = () => {
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
          onClick={toggleDropdownInfo}
          className="w-10 h-10  bg-gray-100/40 dark:bg-gray-500/60 border border-gray-200/30 dark:border-gray-500/60 rounded-full flex items-center justify-center transition-all duration-300 hover:text-primary-200 p-2 "
        >
          <Icon size={20} />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg">
          <div className="py-1 bg-light dark:bg-[#575B64] rounded-md shadow-xs">
            <div className="w-full text-left capitalize px-4 py-2 text-base font-normal flex flex-row items-center justify-start gap-3 border-b dark:border-gray-500/70">
              <h3>{title}</h3>
            </div>

            {options.map((option, index) => {
              return (
                <Link
                  key={index}
                  to={option.link}
                  className="w-full text-left px-4 py-2 text-xs font-normal flex flex-row items-center justify-start gap-3 hover:bg-[#454950] hover:text-gray-900 transition-all duration-300"
                  // className="flex flex-row items-start justify-center gap-0 space-x-4"
                >
                  {/* Photo */}
                  <div className="relative w-10 h-10 overflow-hidden">
                    <img
                      className=" w-full h-full object-cover rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                      src={option.photo}
                      alt={option.title}
                    />
                  </div>

                  {/* Info */}
                  <div className="w-72 dark:text-baseTxtLight flex flex-col items-start justify-center gap-0 text-ellipsis  ">
                    <span className="text-sm font-semibold">
                      {option.title}
                    </span>
                    {option.description && (
                      <span className="w-72 text-[0.75rem] font-normal text-baseTxtDark dark:text-baseTxtLight text-ellipsis ">
                        {option.description}
                      </span>
                    )}
                    <span className="text-[0.70rem] font-normal">
                      {option.date}
                    </span>
                  </div>
                </Link>
              )
            })}

            <div className="w-full text-left px-4 py-2 text-base font-normal flex flex-row items-center justify-start gap-3 border-t dark:border-gray-500/70">
              <Link
                to={link}
                className="w-72 text-[0.75rem] font-normal text-baseTxtDark dark:text-baseTxtLight text-ellipsis flex flex-row justify-start items-center gap-1 hover:gap-2 hover:text-primary-200 dark:hover:text-primary-200 transition-all duration-300"
              >
                Ver todas {title}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
