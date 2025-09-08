interface BadgePageProps {
  color:
    | 'red'
    | 'blue'
    | 'green'
    | 'gray'
    | 'black'
    | 'orange'
    | 'yellow'
    | 'purple'
    | 'teal'
    | 'cyan'
    | 'pink'
    | 'indigo'
    | 'lime'
  label: string
  bg?: string
}

export function BadgePage({ color, label, bg }: BadgePageProps) {
  let colorBadge

  switch (color) {
    case 'red':
      colorBadge = 'bg-red-200 border-red-200 text-red-600'
      break
    case 'blue':
      colorBadge = 'bg-blue-200 border-blue-200 text-blue-600'
      break
    case 'green':
      colorBadge = 'bg-green-200 border-green-200 text-green-600'
      break
    case 'gray':
      colorBadge = 'bg-gray-200 border-gray-200 text-gray-600'
      break
    case 'orange':
      colorBadge = 'bg-orange-200 border-orange-200 text-orange-600'
      break
    case 'yellow':
      colorBadge = 'bg-yellow-200 border-yellow-200 text-yellow-600'
      break

    case 'purple':
      colorBadge = 'bg-purple-200 border-purple-200 text-purple-600'
      break
    case 'teal':
      colorBadge = 'bg-teal-200 border-teal-200 text-teal-600'
      break
    case 'cyan':
      colorBadge = 'bg-cyan-200 border-cyan-200 text-cyan-600'
      break
    case 'pink':
      colorBadge = 'bg-pink-200 border-pink-200 text-pink-600'
      break
    case 'indigo':
      colorBadge = 'bg-indigo-200 border-indigo-200 text-indigo-600'
      break
    case 'lime':
      colorBadge = 'bg-lime-200 border-lime-200 text-lime-600'
      break
    case 'black':
      colorBadge = `text-white`
      break

    default:
      break
  }
  return (
    <span
      style={{ backgroundColor: bg }}
      className={`flex flex-row justify-center items-center py-2 px-8 text-sm font-medium rounded-full border ${colorBadge}`}
    >
      {label}
    </span>
  )
}
