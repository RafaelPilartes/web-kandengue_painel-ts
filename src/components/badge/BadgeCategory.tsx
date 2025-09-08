import React from 'react'

interface CategoryBadgeProps {
  label: string
  color: 'red' | 'blue' | 'green' | 'gray' | 'black' | 'orange' | 'yellow'
  bg?: string // Adicione esta propriedade
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ label, color }) => {
  // const badgeStyle = {
  //   backgroundColor: bg
  // }

  let colorBadge

  switch (color) {
    case 'red':
      colorBadge = 'bg-red-200 text-red-600'
      break
    case 'blue':
      colorBadge = 'bg-blue-200 text-blue-600'
      break
    case 'green':
      colorBadge = 'bg-green-200 text-green-600'
      break
    case 'gray':
      colorBadge = 'bg-gray-200 text-gray-600'
      break
    case 'orange':
      colorBadge = 'bg-orange-200 text-orange-600'
      break
    case 'yellow':
      colorBadge = 'bg-yellow-200 text-yellow-600'
      break
    case 'black':
      colorBadge = `text-white`
      break

    default:
      break
  }

  return (
    <div
      className={`w-auto flex flex-row whitespace-nowrap justify-center items-center py-1 px-3 text-[0.7rem] font-medium rounded-full ${colorBadge}`}
      // style={badgeStyle}
    >
      {label}
    </div>
  )
}

export default CategoryBadge
