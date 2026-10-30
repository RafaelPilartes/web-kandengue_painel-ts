import type { ReactNode } from 'react'
import { cn } from '@/lib/tailwind-merge'

export type BadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'brand'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  warning:
    'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200',
  brand:
    'bg-primary-50 text-primary-600 dark:bg-primary-900/60 dark:text-primary-100'
}

/** A short state label. The tone carries meaning; never use it for decoration. */
export function Badge({
  tone = 'neutral',
  children,
  className
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}
