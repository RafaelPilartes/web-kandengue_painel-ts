import {
  WORK_TASK_PRIORITY_LABELS,
  WORK_TASK_STATUS_LABELS,
  WORK_TASK_STATUSES
} from '@rafaelpilartes/kandengue-shared/constants'
import type { WorkTaskStatus } from '@rafaelpilartes/kandengue-shared/types'
import { CalendarClock, ListChecks } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Badge } from '@/components/ui/badge'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { cn } from '@/lib/tailwind-merge'
import {
  formatDay,
  isOverdue,
  PRIORITY_TONE,
  stepProgress,
  useWorkContext
} from '../shared'

/** "2/5" steps done; green once all are. Nothing when the task has no checklist. */
export function StepCount({ task }: { task: WorkTask }) {
  const { done, total } = stepProgress(task)
  if (!total) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs tabular-nums',
        done === total
          ? 'text-emerald-700 dark:text-emerald-300'
          : 'text-gray-500 dark:text-gray-400'
      )}
      aria-label={`${done} de ${total} passos feitos`}
    >
      <ListChecks size={12} aria-hidden />
      {done}/{total}
    </span>
  )
}

/**
 * Four columns, cards dragged with the browser's own drag and drop. Dropping
 * on a card puts the dragged one before it; on the column's free space, at
 * the end. Keyboard users change the status in the task drawer.
 */
export function TaskBoard({
  tasks,
  onOpen,
  onMove
}: {
  tasks: WorkTask[]
  onOpen: (task: WorkTask) => void
  onMove: (
    taskId: string,
    status: WorkTaskStatus,
    beforeId: string | null
  ) => void
}) {
  const ctx = useWorkContext()
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<WorkTaskStatus | null>(null)

  const columns = WORK_TASK_STATUSES.map(status => ({
    status,
    tasks: tasks
      .filter(t => t.status === status)
      .sort((a, b) => a.position - b.position)
  }))

  // The server places by card id, not by index: the board may show only part
  // of the column (a member's own tasks, a filter), so an index counted here
  // would land among cards this admin cannot see.
  const drop = (e: DragEvent, status: WorkTaskStatus, before?: WorkTask) => {
    e.preventDefault()
    e.stopPropagation()
    setOver(null)
    const id = e.dataTransfer.getData('text/plain')
    if (!id || id === before?.id) return
    onMove(id, status, before?.id ?? null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map(col => (
        <section
          key={col.status}
          aria-label={WORK_TASK_STATUS_LABELS[col.status]}
          onDragOver={e => {
            e.preventDefault()
            setOver(col.status)
          }}
          onDragLeave={() => setOver(null)}
          onDrop={e => drop(e, col.status)}
          className={cn(
            'flex min-h-48 flex-col gap-3 rounded-md bg-gray-200/60 p-3 transition-colors dark:bg-gray-800/60',
            over === col.status && 'bg-primary-50 dark:bg-primary-900/30'
          )}
        >
          <header className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-dark dark:text-light">
              {WORK_TASK_STATUS_LABELS[col.status]}
            </h2>
            <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
              {col.tasks.length}
            </span>
          </header>

          {col.tasks.map(task => (
            <article
              key={task.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', task.id)
                e.dataTransfer.effectAllowed = 'move'
                setDragging(task.id)
              }}
              onDragEnd={() => setDragging(null)}
              onDrop={e => drop(e, col.status, task)}
              className={cn(
                'rounded-lg border border-gray-200 bg-light p-3 shadow-sm dark:border-gray-700 dark:bg-dark',
                dragging === task.id && 'opacity-50'
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(task)}
                className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 rounded"
              >
                <p className="text-sm font-medium text-dark [text-wrap:pretty] dark:text-light">
                  {task.title}
                </p>
                {ctx.workScope === 'all' && (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {ctx.departmentName(task.department_id)}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={PRIORITY_TONE[task.priority]}>
                      {WORK_TASK_PRIORITY_LABELS[task.priority]}
                    </Badge>
                    {task.due_date && (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          isOverdue(task)
                            ? 'font-medium text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        <CalendarClock size={12} aria-hidden />
                        {formatDay(task.due_date)}
                      </span>
                    )}
                    <StepCount task={task} />
                  </div>
                  <AvatarStack names={ctx.peopleNames(task.assignee_ids)} />
                </div>
              </button>
            </article>
          ))}

          {col.tasks.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
              Arraste uma tarefa para aqui
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
