import { ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useRef, type JSX } from 'react'

interface AccordionItem {
  label: string
  icon?: JSX.Element
  to: string
  subMenus?: {
    label: string
    icon: JSX.Element
    to: string
    notification: number
  }[]
  accordion: boolean
  notification?: number
}

interface AccordionProps {
  items: AccordionItem
  isActive: boolean
  toggle: () => void
}

const AccordionSidBar: React.FC<AccordionProps> = ({
  items,
  isActive,
  toggle
}) => {
  const accordionRef = useRef<HTMLDivElement>(null)

  // Fechar o acordeão ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isActive &&
        accordionRef.current &&
        !accordionRef.current.contains(event.target as Node)
      ) {
        toggle()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isActive, toggle])

  return (
    <div ref={accordionRef} className="accordion-item">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between py-2 px-3 hover:text-primary-200 dark:hover:text-primary-200 rounded-lg transition-all duration-100"
      >
        <div className="flex items-center gap-2">
          {items.icon}
          <span className="flex text-sm">{items.label}</span>
        </div>
        {isActive ? (
          <ChevronUp
            size={16}
            className="text-gray-500 ml-2 dark:text-gray-300 hover:text-primary-200 dark:hover:text-primary-200"
          />
        ) : (
          <ChevronDown
            size={16}
            className="text-gray-500 ml-2 dark:text-gray-300 hover:text-primary-200 dark:hover:text-primary-200"
          />
        )}
      </button>

      {isActive && (
        <div className="fixed z-10 bg-white dark:bg-gray-700 shadow rounded-lg w-56 mt-1 divide-y divide-gray-100 dark:divide-gray-600">
          <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
            {items.subMenus?.map((submenu, index) => (
              <li key={index}>
                <Link
                  to={submenu.to}
                  className="block px-4 py-2 dark:text-gray-300 hover:text-primary-200 dark:hover:text-primary-200"
                >
                  <div className="flex items-center gap-2">
                    {submenu.icon}
                    <span>{submenu.label}</span>
                    {submenu.notification !== 0 && (
                      <span className="ml-auto w-6 h-6 text-xs flex items-center justify-center rounded-full bg-blue-200 text-black">
                        {submenu.notification}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AccordionSidBar
