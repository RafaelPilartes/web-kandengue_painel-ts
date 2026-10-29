import {
  WORK_TASK_PRIORITY_LABELS,
  WORK_TASK_STATUS_LABELS,
  WORK_TASK_STATUSES
} from '@rafaelpilartes/kandengue-shared-v4/constants'
import type { WorkTaskStatus } from '@rafaelpilartes/kandengue-shared-v4/types'
import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/modal/AppModal'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SelectField, TextAreaField } from '@/components/ui/field'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import {
  useTaskComments,
  useTaskMutations,
  useWorkProjects
} from '@/viewModels/WorkViewModel'
import { formatDay, isOverdue, PRIORITY_TONE, useWorkContext } from '../shared'
import { TaskFormModal } from './TaskFormModal'

const formatWhen = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('pt-AO', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'Africa/Luanda'
      }).format(new Date(iso))
    : ''

export function TaskDrawer({
  task,
  onClose
}: {
  task: WorkTask
  onClose: () => void
}) {
  const ctx = useWorkContext()
  const { projects } = useWorkProjects()
  const { move, archive } = useTaskMutations()
  const { comments, add } = useTaskComments(task.id)
  const [editing, setEditing] = useState(false)
  const [comment, setComment] = useState('')
  const project = projects.find(p => p.id === task.project_id)

  async function changeStatus(status: WorkTaskStatus) {
    try {
      // To the end of the new column; the board is where order is chosen.
      await move.mutateAsync({
        id: task.id,
        status,
        beforeId: null
      })
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  async function doArchive() {
    if (
      !window.confirm(
        'Arquivar esta tarefa? Deixa de aparecer no quadro e nas listas.'
      )
    )
      return
    try {
      await archive.mutateAsync(task.id)
      showToast('success', 'Tarefa arquivada.')
      onClose()
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  async function sendComment(e: FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    try {
      await add.mutateAsync(comment)
      setComment('')
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  if (editing)
    return <TaskFormModal task={task} onClose={() => setEditing(false)} />

  return (
    <AppModal
      isOpen
      onClose={onClose}
      variant="drawer"
      size="md"
      title={task.title}
      footer={
        ctx.canEdit(task) && (
          <>
            <Button
              variant="danger"
              onClick={doArchive}
              loading={archive.isPending}
            >
              Arquivar
            </Button>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Editar
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone={PRIORITY_TONE[task.priority]}>
            {WORK_TASK_PRIORITY_LABELS[task.priority]}
          </Badge>
          {isOverdue(task) && <Badge tone="danger">Atrasada</Badge>}
        </div>

        <SelectField
          label="Estado"
          value={task.status}
          options={WORK_TASK_STATUSES.map(s => ({
            value: s,
            label: WORK_TASK_STATUS_LABELS[s]
          }))}
          disabled={move.isPending}
          onChange={e => changeStatus(e.target.value as WorkTaskStatus)}
        />

        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-gray-500 dark:text-gray-400">Responsável</dt>
          <dd className="flex items-center gap-2 text-dark dark:text-light">
            {task.assignee_id && (
              <Avatar alt={ctx.adminName(task.assignee_id)} size="sm" />
            )}
            {ctx.adminName(task.assignee_id)}
          </dd>
          <dt className="text-gray-500 dark:text-gray-400">Departamento</dt>
          <dd className="text-dark dark:text-light">
            {ctx.departmentName(task.department_id)}
          </dd>
          <dt className="text-gray-500 dark:text-gray-400">Projecto</dt>
          <dd className="text-dark dark:text-light">{project?.name ?? '—'}</dd>
          <dt className="text-gray-500 dark:text-gray-400">Prazo</dt>
          <dd
            className={
              isOverdue(task)
                ? 'font-medium text-red-600 dark:text-red-400'
                : 'text-dark dark:text-light'
            }
          >
            {formatDay(task.due_date)}
          </dd>
          <dt className="text-gray-500 dark:text-gray-400">Criada por</dt>
          <dd className="text-dark dark:text-light">
            {ctx.adminName(task.created_by)}
          </dd>
        </dl>

        {task.description && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 [text-wrap:pretty] dark:text-gray-200">
            {task.description}
          </p>
        )}

        <section className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-600">
          <h3 className="text-sm font-semibold text-dark dark:text-light">
            Comentários
          </h3>
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ainda sem comentários. Use-os para combinar o que falta.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {comments.map(c => (
                <li key={c.id} className="flex gap-3">
                  <Avatar alt={ctx.adminName(c.author_id)} size="sm" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-dark dark:text-light">
                        {ctx.adminName(c.author_id)}
                      </span>{' '}
                      · {formatWhen(c.created_at)}
                    </p>
                    <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-200">
                      {c.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={sendComment} className="flex flex-col gap-2">
            <TextAreaField
              label="Novo comentário"
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="min-h-16"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                loading={add.isPending}
                disabled={!comment.trim()}
              >
                Comentar
              </Button>
            </div>
          </form>
        </section>
      </div>
    </AppModal>
  )
}
