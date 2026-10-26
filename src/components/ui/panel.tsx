import type { ReactNode } from 'react'
import { cn } from '@/lib/tailwind-merge'

/** A surface section of a page, with an optional heading row. */
export function Panel({
  title,
  actions,
  className,
  children
}: {
  title?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'flex w-full flex-col gap-4 rounded-md bg-light p-6 dark:bg-dark',
        className
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="text-lg font-semibold text-dark dark:text-light">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
