import { CalendarClock, CheckCircle2, FolderKanban, Timer } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel } from '@/components/ui/panel'
import { routsNameMain } from '@/constants/routsName'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { useAdminStore } from '@/stores/userStore'
import { isOverdue, PRIORITY_TONE, projectPath } from '@/pages/main/Work/shared'
import { useWorkProjects, useWorkTasks } from '@/viewModels/WorkViewModel'

/**
 * What this admin has open, before the operation's numbers.
 *
 * ── Why no permission guards it ──
 * The work module is `any_admin` in the API, and what each person SEES there
 * is already decided by the API against their permissions — their own tasks,
 * or their department's. So this panel asks for nothing: it shows what the
 * same endpoint would show on the Trabalho screen, and an admin with nothing
 * assigned sees an empty state rather than a locked card.
 */
const DUE_SOON_DAYS = 7

const dayLabel = (iso: string | null) => {
  if (!iso) return 'Sem prazo'
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short'
  })
}

export function MyWorkPanel() {
  const meId = useAdminStore(s => s.currentAdminData?.id) ?? ''
  const { tasks, isLoading } = useWorkTasks()
  const { projects } = useWorkProjects()

  const mine = useMemo(
    () =>
      tasks.filter(
        t =>
          !t.archived &&
          t.status !== 'done' &&
          (t.assignee_ids.includes(meId) || t.created_by === meId)
      ),
    [tasks, meId]
  )

  const overdue = useMemo(() => mine.filter(t => isOverdue(t)), [mine])

  const dueSoon = useMemo(() => {
    const limit = new Date()
    limit.setDate(limit.getDate() + DUE_SOON_DAYS)
    return mine
      .filter(
        t => !isOverdue(t) && t.due_date && new Date(t.due_date) <= limit
      )
      .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
      .slice(0, 5)
  }, [mine])

  /** A project is "mine" when I own it or I am on one of its tasks. */
  const myProjects = useMemo(() => {
    const fromTasks = new Set(
      tasks
        .filter(t => t.assignee_ids.includes(meId) || t.created_by === meId)
        .map(t => t.project_id)
        .filter(Boolean) as string[]
    )
    return projects.filter(
      p => p.status !== 'archived' && (p.owner_id === meId || fromTasks.has(p.id))
    )
  }, [projects, tasks, meId])

  return (
    <Panel className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-dark dark:text-light">
          O meu trabalho
        </h2>
        <Link
          to={routsNameMain.work.tasks}
          className="text-sm text-primary-200 hover:underline"
        >
          Ver todas as tarefas
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CountTile
          icon={<CheckCircle2 size={18} />}
          label="Tarefas abertas"
          value={mine.length}
          to={routsNameMain.work.tasks}
        />
        <CountTile
          icon={<Timer size={18} />}
          label="Atrasadas"
          value={overdue.length}
          tone={overdue.length > 0 ? 'danger' : 'neutral'}
          to={routsNameMain.work.tasks}
        />
        <CountTile
          icon={<FolderKanban size={18} />}
          label="Projectos"
          value={myProjects.length}
          to={routsNameMain.work.projects}
        />
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500">
          A carregar o seu trabalho…
        </p>
      ) : mine.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} />}
          title="Não tem tarefas abertas"
          description="Quando lhe atribuírem uma tarefa, ela aparece aqui."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <TaskList
            title="Atrasadas"
            icon={<Timer size={16} />}
            tasks={overdue.slice(0, 5)}
            empty="Nada atrasado."
          />
          <TaskList
            title="Próximos prazos"
            icon={<CalendarClock size={16} />}
            tasks={dueSoon}
            empty={`Sem prazos nos próximos ${DUE_SOON_DAYS} dias.`}
          />
        </div>
      )}

      {myProjects.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Projectos em que estou
          </p>
          <div className="flex flex-wrap gap-2">
            {myProjects.map(project => (
              <Link
                key={project.id}
                to={projectPath(project.id)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:border-primary-200 hover:text-primary-200 dark:border-gray-700"
              >
                {project.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}

function CountTile({
  icon,
  label,
  value,
  to,
  tone = 'neutral'
}: {
  icon: React.ReactNode
  label: string
  value: number
  to: string
  tone?: 'neutral' | 'danger'
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-primary-200 dark:border-gray-700"
    >
      <span
        className={
          tone === 'danger' && value > 0
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-500 dark:text-gray-400'
        }
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-semibold leading-none text-dark dark:text-light">
          {value}
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </span>
    </Link>
  )
}

function TaskList({
  title,
  icon,
  tasks,
  empty
}: {
  title: string
  icon: React.ReactNode
  tasks: WorkTask[]
  empty: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {icon}
        {title}
      </p>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map(task => (
            <li key={task.id}>
              <Link
                to={routsNameMain.work.tasks}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors hover:border-primary-200 dark:border-gray-700"
              >
                <span className="min-w-0 truncate">{task.title}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={PRIORITY_TONE[task.priority]}>
                    {dayLabel(task.due_date)}
                  </Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
