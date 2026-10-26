import type { ReactNode } from 'react'

/** What to show when a list is empty: say why, and what to do next. */
export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon && (
        <div className="mb-1 text-gray-400 dark:text-gray-500">{icon}</div>
      )}
      <p className="text-base font-semibold text-dark dark:text-light">
        {title}
      </p>
      {description && (
        <p className="max-w-[48ch] text-sm text-gray-600 dark:text-gray-300">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
