// src/components/ui/button.tsx
import { cn } from '@/lib/tailwind-merge'
import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  const base =
    'px-4 py-2 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50'

  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline:
      'border border-gray-300 text-gray-900 hover:bg-gray-100 focus:ring-gray-400 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800'
  }

  return (
    <button className={cn(base, variants[variant], className)} {...props} />
  )
}
