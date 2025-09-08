import { useState } from 'react'

interface AccordionItem {
  title: string
  content: string
}

interface AccordionProps {
  items: AccordionItem[]
}

const Accordion: React.FC<AccordionProps> = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const toggleAccordion = (index: number) => {
    if (activeIndex === index) {
      setActiveIndex(null)
    } else {
      setActiveIndex(index)
    }
  }

  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div key={index} className="mb-4 border rounded-lg overflow-hidden">
          <button
            className="w-full p-4 bg-gray-100 hover:bg-gray-200 focus:outline-none"
            onClick={() => toggleAccordion(index)}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <svg
                className={`w-6 h-6 transition-transform ${
                  activeIndex === index ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={activeIndex === index ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'}
                />
              </svg>
            </div>
          </button>
          {activeIndex === index && (
            <div className="p-4 bg-white">
              <p className="text-gray-700">{item.content}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Accordion
