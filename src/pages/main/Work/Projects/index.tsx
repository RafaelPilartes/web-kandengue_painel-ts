import { WORK_PROJECT_STATUS_LABELS } from '@rafaelpilartes/kandengue-shared-v4/constants'
import type { WorkProjectStatus } from '@rafaelpilartes/kandengue-shared-v4/types'
import { AlertTriangle, ChevronRight, FolderKanban, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Panel } from '@/components/ui/panel'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/tailwind-merge'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { useWorkProjects, useWorkTasks } from '@/viewModels/WorkViewModel'
import {
  formatDay,
  isOverdue,
  projectPath,
  projectPeople,
  useWorkContext
} from '../shared'
import { ProgressBar } from '../Tasks/TaskChecklist'
import { ProjectFormModal } from './ProjectFormModal'

export function WorkProjectsPage() {
  const ctx = useWorkContext()
  const navigate = useNavigate()
  const { projects, isLoading } = useWorkProjects()
  const { tasks } = useWorkTasks()
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState<WorkProjectStatus>('active')

  const tasksOf = useMemo(() => {
    const map = new Map<string, WorkTask[]>()
    for (const t of tasks)
      if (t.project_id)
        map.set(t.project_id, [...(map.get(t.project_id) ?? []), t])
    return map
  }, [tasks])
  const counts = {
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length
  }
  const shown = projects
    .filter(p => p.status === status)
    .sort(
      (a, b) =>
        (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') ||
        a.name.localeCompare(b.name, 'pt')
    )

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Projectos"
        description="Cada projecto junta as tarefas de uma entrega. Abra um para ver o quadro, as pessoas e o que está atrasado."
        actions={
          ctx.canManageProjects && (
            <Button
              icon={<Plus size={16} aria-hidden />}
              onClick={() => setCreating(true)}
            >
              Novo projecto
            </Button>
          )
        }
      />

      <Panel>
        <Segmented
          label="Estado dos projectos"
          value={status}
          onChange={setStatus}
          options={(['active', 'completed', 'archived'] as const).map(s => ({
            value: s,
            label:
              s === 'active'
                ? 'Activos'
                : s === 'completed'
                  ? 'Concluídos'
                  : 'Arquivados',
            count: counts[s]
          }))}
        />

        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            A carregar projectos…
          </p>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={36} />}
            title={
              projects.length === 0
                ? 'Ainda não há projectos'
                : `Nenhum projecto ${WORK_PROJECT_STATUS_LABELS[status].toLowerCase()}`
            }
            description={
              projects.length > 0
                ? 'Os outros estão nos separadores ao lado.'
                : ctx.canManageProjects
                  ? 'Crie um projecto para juntar as tarefas de uma mesma entrega.'
                  : 'Quando o seu Gestor criar projectos, aparecem aqui.'
            }
          />
        ) : (
          <div className="flex flex-col">
            <div
              aria-hidden
              className="hidden grid-cols-[minmax(0,1fr)_7rem_12rem_6rem_1.25rem] gap-4 border-b border-gray-200 px-3 pb-2 text-xs font-medium text-gray-500 lg:grid dark:border-gray-700 dark:text-gray-400"
            >
              <span>Projecto</span>
              <span>Pessoas</span>
              <span>Progresso</span>
              <span>Prazo</span>
              <span />
            </div>
            <ul className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
              {shown.map(p => {
                const list = tasksOf.get(p.id) ?? []
                const done = list.filter(t => t.status === 'done').length
                const late = list.filter(t => isOverdue(t)).length
                const pastDue =
                  p.status === 'active' &&
                  !!p.due_date &&
                  new Date(p.due_date) < new Date()
                return (
                  <li key={p.id}>
                    <Link
                      to={projectPath(p.id)}
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-md px-3 py-4 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 lg:grid-cols-[minmax(0,1fr)_7rem_12rem_6rem_1.25rem] dark:hover:bg-gray-700/40"
                    >
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate text-base font-semibold text-dark group-hover:text-primary-200 dark:text-light">
                          {p.name}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          {ctx.departmentName(p.department_id)} · responsável{' '}
                          {ctx.adminName(p.owner_id)}
                          {late > 0 && (
                            <span className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                              <AlertTriangle size={12} aria-hidden />
                              {late} {late === 1 ? 'atrasada' : 'atrasadas'}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="justify-self-end lg:justify-self-start">
                        <AvatarStack
                          names={ctx.peopleNames(projectPeople(p, list))}
                          max={4}
                        />
                      </div>
                      <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
                        <ProgressBar
                          done={done}
                          total={list.length}
                          label={`Progresso de ${p.name}`}
                        />
                        <span className="w-16 shrink-0 text-right text-xs tabular-nums text-gray-600 dark:text-gray-300">
                          {list.length
                            ? `${done}/${list.length}`
                            : 'sem tarefas'}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'hidden text-sm tabular-nums lg:block',
                          pastDue
                            ? 'font-medium text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-300'
                        )}
                      >
                        {formatDay(p.due_date)}
                      </span>
                      <ChevronRight
                        size={18}
                        aria-hidden
                        className="hidden text-gray-400 transition-transform group-hover:translate-x-0.5 lg:block"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </Panel>

      {creating && (
        <ProjectFormModal
          onClose={() => setCreating(false)}
          onCreated={id => navigate(projectPath(id))}
        />
      )}
    </div>
  )
}
