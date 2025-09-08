import React from 'react'

interface BadgeOutlineProps {
  isOutline?: boolean
  label: string
  color: 'red' | 'blue' | 'green' | 'gray' | 'black' | 'orange' | 'yellow'
  bg?: string // Adicione esta propriedade
}

const BadgeOutline: React.FC<BadgeOutlineProps> = ({
  isOutline = false,
  label,
  color
}) => {
  // const badgeStyle = {
  //   backgroundColor: bg
  // }

  let colorBadge

  switch (color) {
    case 'red':
      colorBadge = `${
        isOutline ? 'border-red-600 text-red-600' : 'bg-red-200 text-red-600'
      }`
      break
    case 'blue':
      colorBadge = `${
        isOutline
          ? 'border-blue-600 text-blue-600'
          : 'bg-blue-200 text-blue-600'
      }`
      break
    case 'green':
      colorBadge = `${
        isOutline
          ? 'border-green-600 text-green-600'
          : 'bg-green-200 text-green-600'
      }`
      break
    case 'gray':
      colorBadge = `${
        isOutline
          ? 'border-gray-600 text-gray-600'
          : 'bg-gray-200 text-gray-600'
      }`
      break
    case 'orange':
      colorBadge = `${
        isOutline
          ? 'border-orange-600 text-orange-600'
          : 'bg-orange-200 text-orange-600'
      }`
      break
    case 'yellow':
      colorBadge = `${
        isOutline
          ? 'border-yellow-600 text-yellow-600'
          : 'bg-yellow-200 text-yellow-600'
      }`
      break
    case 'black':
      colorBadge = `text-white`
      break

    default:
      break
  }

  return (
    <div
      className={`w-auto flex flex-row whitespace-nowrap justify-center items-center px-5 text-[0.85rem] font-medium border rounded-full ${colorBadge}`}
      // style={badgeStyle}
    >
      {label}
    </div>
  )
}

export default BadgeOutline
