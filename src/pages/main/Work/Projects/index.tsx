import {
  WORK_PROJECT_STATUS_LABELS,
  WORK_PROJECT_STATUSES
} from '@rafaelpilartes/kandengue-shared-v4/constants'
import type { WorkProjectStatus } from '@rafaelpilartes/kandengue-shared-v4/types'
import { FolderKanban, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/modal/AppModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { Panel } from '@/components/ui/panel'
import type { WorkProject } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import { useWorkProjects, useWorkTasks } from '@/viewModels/WorkViewModel'
import { dueDateToIso, formatDay, isoToDay, useWorkContext } from '../shared'
import { TaskTable } from '../Tasks/TaskTable'
import { TaskDrawer } from '../Tasks/TaskDrawer'

const STATUS_TONE = {
  active: 'info',
  completed: 'success',
  archived: 'neutral'
} as const

function ProjectModal({
  project,
  onClose
}: {
  project?: WorkProject
  onClose: () => void
}) {
  const ctx = useWorkContext()
  const { create, update } = useWorkProjects()
  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [departmentId, setDepartmentId] = useState(
    project?.department_id ?? ctx.myDepartment ?? ''
  )
  const [ownerId, setOwnerId] = useState(project?.owner_id ?? ctx.meId)
  const [due, setDue] = useState(isoToDay(project?.due_date ?? null))
  const [status, setStatus] = useState<WorkProjectStatus>(
    project?.status ?? 'active'
  )
  const [nameError, setNameError] = useState<string>()

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      setNameError('O nome tem de ter pelo menos 2 caracteres.')
      return
    }
    const values = {
      name: name.trim(),
      description,
      department_id: departmentId,
      owner_id: ownerId,
      due_date: dueDateToIso(due),
      status
    }
    try {
      if (project) await update.mutateAsync({ id: project.id, values })
      else await create.mutateAsync(values)
      showToast(
        'success',
        project ? 'Projecto actualizado.' : 'Projecto criado.'
      )
      onClose()
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  return (
    <AppModal
      isOpen
      onClose={onClose}
      size="md"
      title={project ? 'Editar projecto' : 'Novo projecto'}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Nome"
          value={name}
          error={nameError}
          autoFocus
          onChange={e => {
            setName(e.target.value)
            setNameError(undefined)
          }}
        />
        <TextAreaField
          label="Descrição"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Departamento"
            value={departmentId}
            disabled={ctx.level !== 'direction'}
            options={ctx.departments
              .filter(d => d.active)
              .map(d => ({ value: d.id, label: d.name }))}
            onChange={e => setDepartmentId(e.target.value)}
          />
          <SelectField
            label="Responsável"
            value={ownerId}
            options={ctx.admins
              .filter(
                a =>
                  ctx.level === 'direction' || a.department_id === departmentId
              )
              .map(a => ({ value: a.id, label: a.name }))}
            onChange={e => setOwnerId(e.target.value)}
          />
          <TextField
            label="Prazo"
            type="date"
            value={due}
            onChange={e => setDue(e.target.value)}
          />
          {project && (
            <SelectField
              label="Estado"
              value={status}
              options={WORK_PROJECT_STATUSES.map(s => ({
                value: s,
                label: WORK_PROJECT_STATUS_LABELS[s]
              }))}
              onChange={e => setStatus(e.target.value as WorkProjectStatus)}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-600">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {project ? 'Guardar alterações' : 'Criar projecto'}
          </Button>
        </div>
      </form>
    </AppModal>
  )
}

function ProjectTasks({ project }: { project: WorkProject }) {
  const { tasks } = useWorkTasks({ project_id: project.id })
  const [openId, setOpenId] = useState<string | null>(null)
  const open = tasks.find(t => t.id === openId)
  if (!tasks.length)
    return (
      <p className="px-3 pb-3 text-sm text-gray-500 dark:text-gray-400">
        Sem tarefas neste projecto.
      </p>
    )
  return (
    <>
      <TaskTable tasks={tasks} onOpen={t => setOpenId(t.id)} />
      {open && <TaskDrawer task={open} onClose={() => setOpenId(null)} />}
    </>
  )
}

export function WorkProjectsPage() {
  const ctx = useWorkContext()
  const { projects, isLoading } = useWorkProjects()
  const [editing, setEditing] = useState<WorkProject | 'new' | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Projectos"
        description="Agrupam tarefas com um objectivo e um prazo comuns. O progresso conta as tarefas feitas."
        actions={
          ctx.canManageProjects && (
            <Button icon={<Plus size={16} />} onClick={() => setEditing('new')}>
              Novo projecto
            </Button>
          )
        }
      />
      <Panel>
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-500">
            A carregar projectos…
          </p>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={36} />}
            title="Ainda não há projectos"
            description={
              ctx.canManageProjects
                ? 'Crie um projecto para juntar as tarefas de uma mesma entrega.'
                : 'Quando o seu Gestor criar projectos, aparecem aqui.'
            }
          />
        ) : (
          <ul className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
            {projects.map(p => (
              <li key={p.id} className="flex flex-col gap-3 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <button
                      type="button"
                      aria-expanded={expanded === p.id}
                      onClick={() =>
                        setExpanded(expanded === p.id ? null : p.id)
                      }
                      className="text-left text-base font-semibold text-dark hover:text-primary-200 dark:text-light"
                    >
                      {p.name}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ctx.departmentName(p.department_id)} ·{' '}
                      {ctx.adminName(p.owner_id)} · prazo{' '}
                      {formatDay(p.due_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={STATUS_TONE[p.status]}>
                      {WORK_PROJECT_STATUS_LABELS[p.status]}
                    </Badge>
                    {ctx.canManageProjects && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(p)}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(p.progress * 100)}
                    aria-label={`Progresso de ${p.name}`}
                    className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
                  >
                    <div
                      className="h-full rounded-full bg-primary-200 transition-[width] duration-300"
                      style={{ width: `${p.progress * 100}%` }}
                    />
                  </div>
                  <span className="w-28 text-right text-xs tabular-nums text-gray-600 dark:text-gray-300">
                    {Math.round(p.progress * 100)}% · {p.task_count}{' '}
                    {p.task_count === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>
                {expanded === p.id && <ProjectTasks project={p} />}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {editing && (
        <ProjectModal
          project={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
