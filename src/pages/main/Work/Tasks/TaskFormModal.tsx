import {
  WORK_TASK_PRIORITIES,
  WORK_TASK_PRIORITY_LABELS
} from '@rafaelpilartes/kandengue-shared-v4/constants'
import type { WorkTaskPriority } from '@rafaelpilartes/kandengue-shared-v4/types'
import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/modal/AppModal'
import { Button } from '@/components/ui/button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import { useTaskMutations, useWorkProjects } from '@/viewModels/WorkViewModel'
import { dueDateToIso, isoToDay, useWorkContext } from '../shared'

/** Create (no `task`) or edit a task. The choices follow what the API allows the level. */
export function TaskFormModal({
  task,
  defaultProjectId,
  onClose
}: {
  task?: WorkTask
  defaultProjectId?: string
  onClose: () => void
}) {
  const ctx = useWorkContext()
  const { projects } = useWorkProjects()
  const { create, update } = useTaskMutations()

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [departmentId, setDepartmentId] = useState(
    task?.department_id ?? ctx.myDepartment ?? ''
  )
  const [projectId, setProjectId] = useState(
    task?.project_id ?? defaultProjectId ?? ''
  )
  const [assigneeId, setAssigneeId] = useState(
    task?.assignee_id ?? (ctx.level === 'member' ? ctx.meId : '')
  )
  const [priority, setPriority] = useState<WorkTaskPriority>(
    task?.priority ?? 'medium'
  )
  const [due, setDue] = useState(isoToDay(task?.due_date ?? null))
  const [titleError, setTitleError] = useState<string>()

  const departmentOptions = ctx.departments
    .filter(
      d => d.active && (ctx.level === 'direction' || d.id === ctx.myDepartment)
    )
    .map(d => ({ value: d.id, label: d.name }))
  const assigneeOptions = ctx.admins
    .filter(a =>
      ctx.level === 'direction'
        ? true
        : ctx.level === 'manager'
          ? a.department_id === departmentId
          : a.id === ctx.meId
    )
    .map(a => ({ value: a.id, label: a.name }))
  const projectOptions = projects
    .filter(p => p.department_id === departmentId && p.status === 'active')
    .map(p => ({ value: p.id, label: p.name }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('O título é obrigatório.')
      return
    }
    const values = {
      title: title.trim(),
      description,
      department_id: departmentId,
      project_id: projectId || null,
      assignee_id: assigneeId || null,
      priority,
      due_date: dueDateToIso(due)
    }
    try {
      if (task) await update.mutateAsync({ id: task.id, values })
      else await create.mutateAsync(values)
      showToast('success', task ? 'Tarefa actualizada.' : 'Tarefa criada.')
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
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          label="Título"
          placeholder="Ex.: Rever os documentos dos motoristas novos"
          value={title}
          error={titleError}
          autoFocus
          onChange={e => {
            setTitle(e.target.value)
            setTitleError(undefined)
          }}
        />
        <TextAreaField
          label="Descrição"
          placeholder="O que é preciso fazer, e como se sabe que está feito."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Departamento"
            value={departmentId}
            options={departmentOptions}
            disabled={ctx.level !== 'direction'}
            onChange={e => {
              setDepartmentId(e.target.value)
              setProjectId('')
              if (ctx.level !== 'member') setAssigneeId('')
            }}
          />
          <SelectField
            label="Projecto"
            value={projectId}
            placeholder="Sem projecto"
            options={projectOptions}
            onChange={e => setProjectId(e.target.value)}
          />
          <SelectField
            label="Responsável"
            value={assigneeId}
            placeholder={ctx.level === 'member' ? undefined : 'Sem responsável'}
            options={assigneeOptions}
            disabled={ctx.level === 'member'}
            onChange={e => setAssigneeId(e.target.value)}
          />
          <SelectField
            label="Prioridade"
            value={priority}
            options={WORK_TASK_PRIORITIES.map(p => ({
              value: p,
              label: WORK_TASK_PRIORITY_LABELS[p]
            }))}
            onChange={e => setPriority(e.target.value as WorkTaskPriority)}
          />
          <TextField
            label="Prazo"
            type="date"
            value={due}
            onChange={e => setDue(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-600">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            {task ? 'Guardar alterações' : 'Criar tarefa'}
          </Button>
        </div>
      </form>
    </AppModal>
  )
}
