import { ChevronDown, ChevronUp, Dot } from 'lucide-react'
import React, { useState, type JSX } from 'react'
import { Link } from 'react-router-dom'

interface AccordionItem {
  label: string
  icon: JSX.Element
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
}

export const AccordionMenu: React.FC<AccordionProps> = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState<boolean>(false)

  const toggleAccordion = () => {
    setActiveIndex(!activeIndex)
  }

  return (
    <div className="w-full py-4 px-4 border-b-[0.1rem] border-gray-600 cursor-pointer">
      <div
        className="w-full flex items-start justify-start flex-row"
        onClick={toggleAccordion}
      >
        <div className="w-full text-white text-left font-light text-sm group transition-all hover:text-primary-200">
          <span className="flex flex-row items-center justify-start gap-1 transition-all duration-300">
            {items.icon} {items.label}
          </span>
        </div>
        {activeIndex && (
          <ChevronUp size={16} className="font-extrabold text-white" />
        )}
        {!activeIndex && (
          <ChevronDown size={16} className="font-extrabold text-white" />
        )}
      </div>
      {activeIndex && (
        <>
          {items.subMenus?.map((link, linkIndex) => (
            <Link
              to={link.to}
              key={linkIndex}
              className="w-full py-2 flex items-center justify-between cursor-pointer gap-2 hover:ml-4 hover:text-primary-200 dark:hover:text-primary-300 transition-all duration-250 group"
            >
              <div className="text-white font-light text-sm flex flex-row items-center justify-start gap-1 group-hover:text-primary-200">
                <Dot size={24} />
                {link.label}
              </div>
              {link.notification != 0 && (
                <span className="w-6 h-6 text-black text-xs p-2 flex flex-row items-center justify-center rounded-full bg-blue-200">
                  {link.notification}
                </span>
              )}
            </Link>
          ))}
        </>
      )}
    </div>
  )
}
