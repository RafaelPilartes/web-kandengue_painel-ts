import type { ElementType } from 'react'

interface BadgeActionProps {
  onclickBtn?: () => void
  icon?: ElementType
  label?: string
  color: 'red' | 'blue' | 'green' | 'gray'
}

export function BadgeAction({
  icon: Icon,
  onclickBtn,
  label,
  color
}: BadgeActionProps) {
  return (
    <button
      onClick={onclickBtn}
      className={`flex flex-row justify-center items-center gap-1 py-2 px-2 text-xs font-medium rounded-md bg-${color}-200 text-${color}-600 hover:bg-${color}-400 active:bg-${color}-400 transition-all duration-300`}
    >
      {Icon && <Icon size={18} />}
      {label && label}
    </button>
  )
}
