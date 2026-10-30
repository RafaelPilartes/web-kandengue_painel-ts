import { useState } from 'react'
import { Link } from 'react-router-dom'
import AccordionSidBar from '../accordion/AccordionSidBar'
import dashItem from '@/constants/dash'
import { useAccess } from '@/hooks/useAccess'
import { filterMenu } from '@/routes/access'

export const Slide = () => {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null)

  const { can, level } = useAccess()
  const mapLinks = filterMenu(dashItem, can, level).map((item, index) => {
    return (
      <div key={index}>
        {item.accordion && (
          <AccordionSidBar
            items={item}
            isActive={activeAccordion === index}
            toggle={() =>
              setActiveAccordion(activeAccordion === index ? null : index)
            }
          />
        )}
        {!item.accordion && (
          <Link
            key={index}
            to={item.to}
            className="py-2 px-3 flex items-center justify-between gap-2 hover:text-primary-200 dark:hover:text-primary-200 rounded-md transition-all duration-200 hover:pl-3"
          >
            <div className="flex flex-row items-center justify-start gap-3 ">
              <span>{item.icon}</span>

              <span className="flex text-sm">{item.label}</span>
            </div>
            {item.notification != 0 && (
              <span className="w-6 h-6 text-black text-xs p-2 flex flex-row items-center justify-center rounded-full bg-blue-200">
                {item.notification}
              </span>
            )}
          </Link>
        )}
      </div>
    )
  })

  return (
    <>
      <nav className={`fixed z-[19] left-0 w-screen group overflow-hidden`}>
        {/* Container */}
        <div
          className={`w-full h-full py-2 bg-light dark:bg-dark flex flex-row items-start justify-center shadow-3xl border-b-[1px] border-gray-200 dark:border-gray-700 flex-wrap gap-y-0 gap-x-0 overflow-y-auto`}
        >
          {/* SLinkContainer */}
          {mapLinks}
        </div>
      </nav>
    </>
  )
}
