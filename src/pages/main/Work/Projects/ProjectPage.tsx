import {
  WORK_PROJECT_STATUS_LABELS,
  WORK_TASK_STATUS_LABELS,
  WORK_TASK_STATUSES
} from '@rafaelpilartes/kandengue-shared/constants'
import {
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  Columns3,
  List,
  Pencil,
  Plus
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel } from '@/components/ui/panel'
import { Segmented } from '@/components/ui/segmented'
import { routsNameMain } from '@/constants/routsName'
import { cn } from '@/lib/tailwind-merge'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import {
  useTaskMutations,
  useWorkProjects,
  useWorkTasks
} from '@/viewModels/WorkViewModel'
import {
  formatDay,
  isOverdue,
  PROJECT_STATUS_TONE,
  projectPeople,
  stepProgress,
  useWorkContext
} from '../shared'
import { TaskBoard } from '../Tasks/TaskBoard'
import { ProgressBar } from '../Tasks/TaskChecklist'
import { TaskDrawer } from '../Tasks/TaskDrawer'
import { TaskFormModal } from '../Tasks/TaskFormModal'
import { TaskTable } from '../Tasks/TaskTable'
import { ProjectFormModal } from './ProjectFormModal'

/**
 * One project, the way a team works it: who is on it, how far it is, what is
 * late, and its tasks as a board or a list.
 */
export function WorkProjectPage() {
  const { id = '' } = useParams()
  const ctx = useWorkContext()
  const { projects, isLoading: loadingProjects } = useWorkProjects()
  const { tasks, isLoading } = useWorkTasks({ project_id: id })
  const { move } = useTaskMutations()
  const [view, setView] = useState<'board' | 'list'>('board')
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)

  const project = projects.find(p => p.id === id)
  const open = tasks.find(t => t.id === openId) ?? null

  const summary = useMemo(() => {
    const byStatus = Object.fromEntries(
      WORK_TASK_STATUSES.map(s => [s, tasks.filter(t => t.status === s).length])
    ) as Record<WorkTask['status'], number>
    const steps = tasks.reduce(
      (acc, t) => {
        const p = stepProgress(t)
        return { done: acc.done + p.done, total: acc.total + p.total }
      },
      { done: 0, total: 0 }
    )
    return {
      byStatus,
      steps,
      late: tasks.filter(t => isOverdue(t)),
      upcoming: tasks
        .filter(t => t.status !== 'done' && t.due_date)
        .sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))
        .slice(0, 5)
    }
  }, [tasks])

  const people = useMemo(() => {
    if (!project) return []
    return projectPeople(project, tasks).map(personId => {
      const theirs = tasks.filter(t => t.assignee_ids.includes(personId))
      const steps = tasks.flatMap(t =>
        t.checklist.filter(i => i.assignee_id === personId)
      )
      return {
        id: personId,
        open: theirs.filter(t => t.status !== 'done').length,
        late: theirs.filter(t => isOverdue(t)).length,
        stepsDone: steps.filter(i => i.done).length,
        stepsTotal: steps.length
      }
    })
  }, [project, tasks])

  if (loadingProjects)
    return (
      <Panel>
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          A carregar o projecto…
        </p>
      </Panel>
    )

  if (!project)
    return (
      <Panel>
        <EmptyState
          title="Projecto não encontrado"
          description="Pode ter sido apagado, ou ser de um departamento a que não tem acesso."
          action={
            <Link to={routsNameMain.work.projects}>
              <Button
                variant="secondary"
                icon={<ArrowLeft size={16} aria-hidden />}
              >
                Voltar aos projectos
              </Button>
            </Link>
          }
        />
      </Panel>
    )

  const done = summary.byStatus.done
  const canAddTask = ctx.canManageProjects || ctx.level === 'member'
  const pastDue =
    project.status === 'active' &&
    !!project.due_date &&
    new Date(project.due_date) < new Date()

  const onMove = (
    taskId: string,
    status: WorkTask['status'],
    beforeId: string | null
  ) =>
    move.mutate(
      { id: taskId, status, beforeId },
      { onError: err => showToast('error', (err as Error).message) }
    )

  return (
    <div className="flex w-full flex-col gap-6">
      <header className="flex w-full flex-col gap-5 rounded-md bg-light p-6 dark:bg-dark">
        <Link
          to={routsNameMain.work.projects}
          className="inline-flex w-fit items-center gap-1.5 rounded text-sm text-gray-600 hover:text-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 dark:text-gray-300"
        >
          <ArrowLeft size={16} aria-hidden />
          Projectos
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-dark [text-wrap:balance] dark:text-light">
                {project.name}
              </h1>
              <Badge tone={PROJECT_STATUS_TONE[project.status]}>
                {WORK_PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
              <span>{ctx.departmentName(project.department_id)}</span>
              <span aria-hidden className="text-gray-300 dark:text-gray-600">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Avatar alt={ctx.adminName(project.owner_id)} size="xs" />
                {ctx.adminName(project.owner_id)}
              </span>
              <span aria-hidden className="text-gray-300 dark:text-gray-600">
                ·
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  pastDue && 'font-medium text-red-600 dark:text-red-400'
                )}
              >
                <CalendarClock size={14} aria-hidden />
                {project.due_date
                  ? `Prazo ${formatDay(project.due_date)}`
                  : 'Sem prazo'}
              </span>
            </div>
            {project.description && (
              <p className="max-w-[70ch] whitespace-pre-line text-sm text-gray-700 [text-wrap:pretty] dark:text-gray-200">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ctx.canManageProjects && (
              <Button
                variant="secondary"
                icon={<Pencil size={16} aria-hidden />}
                onClick={() => setEditing(true)}
              >
                Editar
              </Button>
            )}
            {canAddTask && project.status === 'active' && (
              <Button
                icon={<Plus size={16} aria-hidden />}
                onClick={() => setCreating(true)}
              >
                Nova tarefa
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-dark dark:text-light">
              {tasks.length
                ? `${done} de ${tasks.length} tarefas feitas`
                : 'Ainda sem tarefas'}
              {tasks.length > 0 && (
                <span className="ml-2 tabular-nums text-gray-500 dark:text-gray-400">
                  {Math.round((done / tasks.length) * 100)}%
                </span>
              )}
            </p>
            {summary.steps.total > 0 && (
              <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {summary.steps.done} de {summary.steps.total} passos feitos
              </p>
            )}
          </div>
          <ProgressBar
            done={done}
            total={tasks.length}
            label="Tarefas feitas"
          />
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {WORK_TASK_STATUSES.map(s => (
              <div key={s} className="flex items-baseline gap-1.5">
                <dt className="text-gray-500 dark:text-gray-400">
                  {WORK_TASK_STATUS_LABELS[s]}
                </dt>
                <dd className="font-semibold tabular-nums text-dark dark:text-light">
                  {summary.byStatus[s]}
                </dd>
              </div>
            ))}
            <div className="flex items-baseline gap-1.5">
              <dt
                className={
                  summary.late.length
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }
              >
                Atrasadas
              </dt>
              <dd
                className={cn(
                  'font-semibold tabular-nums',
                  summary.late.length
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-dark dark:text-light'
                )}
              >
                {summary.late.length}
              </dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-dark dark:text-light">
              Tarefas
            </h2>
            <Segmented
              label="Vista"
              value={view}
              onChange={setView}
              options={[
                {
                  value: 'board',
                  label: 'Quadro',
                  icon: <Columns3 size={16} aria-hidden />
                },
                {
                  value: 'list',
                  label: 'Lista',
                  icon: <List size={16} aria-hidden />
                }
              ]}
            />
          </div>
          {isLoading ? (
            <Panel>
              <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                A carregar tarefas…
              </p>
            </Panel>
          ) : tasks.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<ClipboardCheck size={36} />}
                title="Este projecto ainda não tem tarefas"
                description="Divida a entrega em tarefas, junte as pessoas e diga o que cada uma faz."
                action={
                  canAddTask && (
                    <Button onClick={() => setCreating(true)}>
                      Criar a primeira tarefa
                    </Button>
                  )
                }
              />
            </Panel>
          ) : view === 'board' ? (
            <TaskBoard
              tasks={tasks}
              onOpen={t => setOpenId(t.id)}
              onMove={onMove}
            />
          ) : (
            <Panel>
              <TaskTable tasks={tasks} onOpen={t => setOpenId(t.id)} />
            </Panel>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Panel title="Pessoas" className="gap-3">
            <ul className="flex flex-col gap-1">
              {people.map(p => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-md py-1.5"
                >
                  <Avatar alt={ctx.adminName(p.id)} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-dark dark:text-light">
                      {ctx.adminName(p.id)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {p.id === project.owner_id
                        ? 'Responsável'
                        : `${p.open} ${p.open === 1 ? 'tarefa aberta' : 'tarefas abertas'}`}
                      {p.late > 0 && (
                        <span className="text-red-600 dark:text-red-400">
                          {' '}
                          · {p.late} {p.late === 1 ? 'atrasada' : 'atrasadas'}
                        </span>
                      )}
                    </span>
                  </div>
                  {p.stepsTotal > 0 && (
                    <span
                      className="text-xs tabular-nums text-gray-500 dark:text-gray-400"
                      title="Passos feitos"
                    >
                      {p.stepsDone}/{p.stepsTotal}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Próximos prazos" className="gap-3">
            {summary.upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma tarefa aberta com prazo.
              </p>
            ) : (
              <ul className="flex flex-col">
                {summary.upcoming.map(t => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(t.id)}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 dark:hover:bg-gray-700/40"
                    >
                      <span className="min-w-0 truncate text-sm text-dark dark:text-light">
                        {t.title}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-xs tabular-nums',
                          isOverdue(t)
                            ? 'font-medium text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {formatDay(t.due_date)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>

      {creating && (
        <TaskFormModal
          defaultProjectId={project.id}
          defaultDepartmentId={project.department_id}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <ProjectFormModal project={project} onClose={() => setEditing(false)} />
      )}
      {open && <TaskDrawer task={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}
