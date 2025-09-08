import { useState } from 'react'

interface AccordionsArrayItem {
  title: string
  content: string
}

interface AccordionsArrayProps {
  items: AccordionsArrayItem[]
}

export function AccordionsArray({ items }: AccordionsArrayProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleAccordionsArray = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div key={index} className="border rounded-md mb-2">
          <button
            className={`w-full py-2 px-4 text-left focus:outline-none ${
              activeIndex === index ? 'bg-gray-200' : 'bg-gray-100'
            } transition duration-300 ease-in-out`}
            onClick={() => toggleAccordionsArray(index)}
          >
            {item.title}
          </button>
          <div
            className={`overflow-hidden transition-max-height duration-300 ease-in-out ${
              activeIndex === index ? 'max-h-40' : 'max-h-0'
            }`}
          >
            <div className="p-4 bg-white">
              <p>{item.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
