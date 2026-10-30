import type { ReactNode } from 'react'
import { cn } from '@/lib/tailwind-merge'

/** A few mutually exclusive views of the same thing: board or list, active or done. */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string; icon?: ReactNode; count?: number }[]
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full self-start overflow-x-auto rounded-lg border border-gray-300 bg-light p-0.5 dark:border-gray-600 dark:bg-dark"
    >
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
            value === o.value
              ? 'bg-primary-200 font-medium text-white'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {o.icon}
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                'tabular-nums text-xs',
                value === o.value
                  ? 'text-white/80'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
