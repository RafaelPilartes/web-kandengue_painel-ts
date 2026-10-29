import { ClipboardCheck, Columns3, List, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectField } from '@/components/ui/field'
import { PageHeader } from '@/components/ui/page-header'
import { Segmented } from '@/components/ui/segmented'
import { Panel } from '@/components/ui/panel'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import {
  useTaskMutations,
  useWorkProjects,
  useWorkTasks
} from '@/viewModels/WorkViewModel'
import { useWorkContext } from '../shared'
import { TaskBoard } from './TaskBoard'
import { TaskTable } from './TaskTable'
import { TaskDrawer } from './TaskDrawer'
import { TaskFormModal } from './TaskFormModal'

type View = 'board' | 'list'

const VIEW_KEY = 'work-tasks-view'
const savedView = (): View => {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'board'
  } catch {
    return 'board'
  }
}

export function WorkTasksPage() {
  const ctx = useWorkContext()
  const { projects } = useWorkProjects()
  const [view, setView] = useState<View>(savedView)
  const [departmentId, setDepartmentId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  // The bell links here with ?task=<id>.
  const [params, setParams] = useSearchParams()
  useEffect(() => {
    const fromLink = params.get('task')
    if (fromLink) {
      setOpenId(fromLink)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const { tasks, isLoading, isError } = useWorkTasks({
    department_id: departmentId || undefined,
    project_id: projectId || undefined,
    assignee_id: assigneeId || undefined
  })
  const { move } = useTaskMutations()
  const open = useMemo(
    () => tasks.find(t => t.id === openId) ?? null,
    [tasks, openId]
  )
  const filtered = !!(departmentId || projectId || assigneeId)

  const changeView = (v: View) => {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      /* a remembered view is only a convenience */
    }
  }

  const onMove = (
    id: string,
    status: WorkTask['status'],
    beforeId: string | null
  ) =>
    move.mutate(
      { id, status, beforeId },
      { onError: err => showToast('error', (err as Error).message) }
    )

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Tarefas"
        description={
          ctx.level === 'direction'
            ? 'O trabalho de todos os departamentos.'
            : ctx.level === 'manager'
              ? 'O trabalho do seu departamento.'
              : 'As tarefas que lhe foram atribuídas ou que criou.'
        }
        actions={
          <>
            <Segmented
              label="Vista"
              value={view}
              onChange={changeView}
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
            <Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
              Nova tarefa
            </Button>
          </>
        }
      />

      {ctx.level !== 'member' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {ctx.level === 'direction' && (
            <SelectField
              label="Departamento"
              value={departmentId}
              placeholder="Todos"
              options={ctx.departments.map(d => ({
                value: d.id,
                label: d.name
              }))}
              onChange={e => setDepartmentId(e.target.value)}
            />
          )}
          <SelectField
            label="Projecto"
            value={projectId}
            placeholder="Todos"
            options={projects
              .filter(p => !departmentId || p.department_id === departmentId)
              .map(p => ({ value: p.id, label: p.name }))}
            onChange={e => setProjectId(e.target.value)}
          />
          <SelectField
            label="Pessoa"
            value={assigneeId}
            placeholder="Todos"
            options={ctx.admins
              .filter(
                a =>
                  ctx.level === 'direction' ||
                  a.department_id === ctx.myDepartment
              )
              .map(a => ({ value: a.id, label: a.name }))}
            onChange={e => setAssigneeId(e.target.value)}
          />
        </div>
      )}

      {isLoading ? (
        <Panel>
          <p className="py-10 text-center text-sm text-gray-500">
            A carregar tarefas…
          </p>
        </Panel>
      ) : isError ? (
        <Panel>
          <EmptyState
            title="Não foi possível carregar as tarefas"
            description="Tente outra vez dentro de momentos."
          />
        </Panel>
      ) : tasks.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<ClipboardCheck size={36} />}
            title={
              filtered
                ? 'Nenhuma tarefa com estes filtros'
                : 'Ainda não há tarefas'
            }
            description={
              filtered
                ? 'Limpe um dos filtros para ver mais.'
                : 'Crie a primeira tarefa: um título, as pessoas e um prazo chegam para começar.'
            }
            action={
              !filtered && (
                <Button onClick={() => setCreating(true)}>Criar tarefa</Button>
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

      {creating && (
        <TaskFormModal
          defaultProjectId={projectId || undefined}
          onClose={() => setCreating(false)}
        />
      )}
      {open && <TaskDrawer task={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}
