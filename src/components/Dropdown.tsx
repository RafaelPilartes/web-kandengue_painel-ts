import type { ElementType } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'

interface DropdownItem {
  label: string
  link: string
}

interface DropdownProps {
  icon?: ElementType
  title: string
  items: DropdownItem[]
}

export function Dropdown({ icon: Icon, title, items }: DropdownProps) {
  return (
    <div className="relative inline-block text-left group">
      <button className="w-full px-4 py-2 rounded-lg flex items-center justify-center flex-row gap-2">
        {title}
        <AiOutlinePlus className="text-primary-200 text-sm" />
      </button>
      <div className="opacity-0 invisible group-hover:opacity-100 py-4 group-hover:visible group-hover:-mt-1 absolute left-0 mt-6 w-48 bg-white rounded-sm shadow-lg transition-all duration-500">
        <ul>
          {items.map((item, index) => (
            <li
              key={index}
              className="py-2 px-4 transition-all duration-300 hover:text-primary-200 hover:ml-2"
            >
              <a href={item.link}>
                {Icon && <Icon size={18} />}

                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Dropdown
