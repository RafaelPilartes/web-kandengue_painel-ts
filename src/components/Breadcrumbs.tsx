import React from 'react'
import { ChevronRight } from 'lucide-react'
import { FaHouse } from 'react-icons/fa6'
import { Link } from 'react-router-dom' // Importe Link para usar navegação interna

interface BreadcrumbProps {
  items: { label: string; to?: string }[]
}

export function Breadcrumbs({ items }: BreadcrumbProps) {
  return (
    <div className="flex flex-row flex-wrap justify-start items-center gap-2 text-primary-200">
      <FaHouse size={16} />
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight size={16} />}
          {item.to ? (
            <Link to={item.to} className="font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="opacity-60">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
