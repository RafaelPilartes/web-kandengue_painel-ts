import type { ReactNode } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'

type Crumb = { label: string; to?: string }

/** Title block of a page: what it is, where it sits, and its main actions. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions
}: {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: ReactNode
}) {
  return (
    <header className="flex w-full flex-col gap-4 rounded-md bg-light p-6 dark:bg-dark">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-row flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold text-dark [text-wrap:balance] dark:text-light">
            {title}
          </h1>
          {description && (
            <p className="max-w-[70ch] text-sm text-gray-600 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  )
}
