import { useState } from 'react'
import { AiOutlineLine } from 'react-icons/ai'
import { BsPlusLg } from 'react-icons/bs'

interface AccordionLinksContentProps {
  title: string
  link: string
}

interface AccordionLinksItem {
  title: string
  content: AccordionLinksContentProps[]
}

interface AccordionLinksProps {
  item: AccordionLinksItem
}

export function AccordionLinks({ item }: AccordionLinksProps) {
  const [isActive, setIsActive] = useState(false)

  const toggleAccordionLinks = () => {
    setIsActive(!isActive)
  }

  return (
    <div className="">
      <button
        className={`w-full py-4 px-4 focus:outline-none text-left font-bold text-base flex justify-between items-center flex-row ${
          isActive && 'text-primary-200'
        } transition duration-300 ease-in-out`}
        onClick={toggleAccordionLinks}
      >
        {item.title}

        {!isActive && <BsPlusLg size={20} />}
        {isActive && <AiOutlineLine size={20} />}
      </button>
      <div
        className={`flex flex-col overflow-hidden transition-max-height duration-300 ease-in-out ${
          isActive ? 'max-h-40' : 'max-h-0'
        }`}
      >
        {item.content.map((content, index) => {
          const n = item.content.length
          const isLast = n == index + 1
          return (
            <a
              key={index}
              href={content.link}
              className={`py-2 px-4 bg-gray-100 group transition-all hover:text-primary-200 text-left font-medium text-base ${
                isLast ? '' : 'border-b-[0.1rem]'
              } `}
            >
              <span className="transition-all duration-300 group-hover:ml-2">
                {content.title}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
