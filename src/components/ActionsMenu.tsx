import { useEffect, useRef, useState } from 'react'
import { DotsThree } from 'phosphor-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ActionItem {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  className?: string // opcional, para customizar estilo individual
}

interface ActionsMenuProps {
  actions: ActionItem[]
}

export function ActionsMenu({ actions }: ActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 flex flex-row gap-0 items-center justify-center transition-colors duration-200"
      >
        <DotsThree
          size={28}
          weight="bold"
          className="text-gray-500 dark:text-gray-300"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-44 origin-top-right rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black/5"
          >
            <div className="py-1 text-sm transition-all duration-200">
              {actions.map((action, index) => {
                if (!action.label) {
                  return null
                }
                return (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick()
                      setOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors ${
                      action.className || ''
                    }`}
                  >
                    {action.icon && (
                      <span className="w-4 h-4">{action.icon}</span>
                    )}
                    {action.label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
