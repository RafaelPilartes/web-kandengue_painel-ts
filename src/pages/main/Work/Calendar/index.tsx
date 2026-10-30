import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Panel } from '@/components/ui/panel'
import { cn } from '@/lib/tailwind-merge'
import { useWorkTasks } from '@/viewModels/WorkViewModel'
import { isoToDay, isOverdue } from '../shared'
import { TaskDrawer } from '../Tasks/TaskDrawer'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const PRIORITY_DOT = {
  low: 'bg-gray-400',
  medium: 'bg-sky-500',
  high: 'bg-amber-500',
  urgent: 'bg-red-600'
} as const

const pad = (n: number) => String(n).padStart(2, '0')

/** A month grid of task deadlines (Monday first), in Angola's calendar. */
export function WorkCalendarPage() {
  const today = isoToDay(new Date().toISOString())
  const [month, setMonth] = useState(() => today.slice(0, 7)) // YYYY-MM
  const [year, m] = month.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate()
  const lead = (new Date(Date.UTC(year, m - 1, 1)).getUTCDay() + 6) % 7

  const { tasks } = useWorkTasks({
    due_from: new Date(`${month}-01T00:00:00+01:00`).toISOString(),
    due_to: new Date(
      `${month}-${pad(daysInMonth)}T23:59:59+01:00`
    ).toISOString()
  })
  const [openId, setOpenId] = useState<string | null>(null)
  const open = tasks.find(t => t.id === openId)

  const byDay = useMemo(() => {
    const map = new Map<string, typeof tasks>()
    for (const t of tasks) {
      const day = isoToDay(t.due_date)
      map.set(day, [...(map.get(day) ?? []), t])
    }
    return map
  }, [tasks])

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(year, m - 1 + delta, 1))
    setMonth(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`)
  }
  const title = new Intl.DateTimeFormat('pt-AO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, m - 1, 1)))

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Calendário"
        description="Os prazos das tarefas que pode ver, dia a dia."
      />
      <Panel
        title={title.charAt(0).toUpperCase() + title.slice(1)}
        actions={
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              aria-label="Mês anterior"
              onClick={() => shift(-1)}
              icon={<ChevronLeft size={16} />}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setMonth(today.slice(0, 7))}
            >
              Hoje
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Mês seguinte"
              onClick={() => shift(1)}
              icon={<ChevronRight size={16} />}
            />
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200 text-sm dark:border-gray-700 dark:bg-gray-700">
          {WEEKDAYS.map(d => (
            <div
              key={d}
              className="bg-gray-100 px-2 py-2 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div
              key={`lead-${i}`}
              className="min-h-24 bg-gray-50 dark:bg-gray-900/40"
            />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = `${month}-${pad(i + 1)}`
            const items = byDay.get(day) ?? []
            return (
              <div
                key={day}
                className="flex min-h-24 flex-col gap-1 bg-light p-1.5 dark:bg-dark"
              >
                <span
                  className={cn(
                    'self-end rounded-full px-1.5 text-xs tabular-nums',
                    day === today
                      ? 'bg-primary-200 font-semibold text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {i + 1}
                </span>
                {items.slice(0, 3).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setOpenId(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700',
                      t.status === 'done' && 'text-gray-400 line-through',
                      isOverdue(t) && 'text-red-600 dark:text-red-400'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        PRIORITY_DOT[t.priority]
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
                {items.length > 3 && (
                  <span className="px-1.5 text-xs text-gray-500">
                    +{items.length - 3} mais
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </Panel>
      {open && <TaskDrawer task={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}
