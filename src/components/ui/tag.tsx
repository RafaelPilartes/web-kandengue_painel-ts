// src/components/ui/tag.tsx
import { cn } from '@/lib/tailwind-merge'
import * as React from 'react'

interface TagProps {
  children: React.ReactNode
  color?: 'default' | 'success' | 'warning' | 'danger'
}

export function Tag({ children, color = 'default' }: TagProps) {
  const colors = {
    default: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success:
      'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
    warning:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
    danger: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200'
  }

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        colors[color]
      )}
    >
      {children}
    </span>
  )
}
