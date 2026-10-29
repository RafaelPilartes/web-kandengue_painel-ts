import {
  WORK_TASK_MAX_ASSIGNEES,
  WORK_TASK_PRIORITIES,
  WORK_TASK_PRIORITY_LABELS
} from '@rafaelpilartes/kandengue-shared-v4/constants'
import type { WorkTaskPriority } from '@rafaelpilartes/kandengue-shared-v4/types'
import { Plus, Trash2 } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { AppModal } from '@/components/modal/AppModal'
import { Button } from '@/components/ui/button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import { PeoplePicker } from '@/components/ui/people-picker'
import { workDAO, type WorkTask } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import { useTaskMutations, useWorkProjects } from '@/viewModels/WorkViewModel'
import { dueDateToIso, isoToDay, useWorkContext } from '../shared'

type DraftStep = { key: number; text: string; assignee_id: string }

/**
 * Create (no `task`) or edit a task, in the side panel. Creating also takes
 * the first steps, each for one of the people chosen; editing leaves the
 * steps to the checklist in the task itself.
 */
export function TaskFormModal({
  task,
  defaultProjectId,
  defaultDepartmentId,
  onClose
}: {
  task?: WorkTask
  defaultProjectId?: string
  defaultDepartmentId?: string
  onClose: () => void
}) {
  const ctx = useWorkContext()
  const formId = useId()
  const { projects } = useWorkProjects()
  const { create, update } = useTaskMutations()

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [departmentId, setDepartmentId] = useState(
    task?.department_id ?? defaultDepartmentId ?? ctx.myDepartment ?? ''
  )
  const [projectId, setProjectId] = useState(
    task?.project_id ?? defaultProjectId ?? ''
  )
  const [people, setPeople] = useState<string[]>(
    task?.assignee_ids ?? (ctx.level === 'member' ? [ctx.meId] : [])
  )
  const [priority, setPriority] = useState<WorkTaskPriority>(
    task?.priority ?? 'medium'
  )
  const [due, setDue] = useState(isoToDay(task?.due_date ?? null))
  const [steps, setSteps] = useState<DraftStep[]>([])
  const [titleError, setTitleError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const departmentOptions = ctx.departments
    .filter(
      d => d.active && (ctx.level === 'direction' || d.id === ctx.myDepartment)
    )
    .map(d => ({ value: d.id, label: d.name }))
  // Direction gathers anyone; a manager, their department; a member, only themselves.
  const peopleOptions = ctx.admins
    .filter(a =>
      ctx.level === 'direction'
        ? true
        : ctx.level === 'manager'
          ? a.department_id === departmentId
          : a.id === ctx.meId
    )
    .map(a => ({
      id: a.id,
      name: a.name,
      hint: a.department_id ? ctx.departmentName(a.department_id) : undefined
    }))
  const projectOptions = projects
    .filter(p => p.department_id === departmentId && p.status === 'active')
    .map(p => ({ value: p.id, label: p.name }))

  const choosePeople = (ids: string[]) => {
    setPeople(ids)
    // A step for someone who left the list goes back to the first person.
    setSteps(s =>
      s.map(step =>
        step.assignee_id && !ids.includes(step.assignee_id)
          ? { ...step, assignee_id: ids[0] ?? '' }
          : step
      )
    )
  }

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
      assignee_ids: people,
      priority,
      due_date: dueDateToIso(due)
    }
    setSaving(true)
    try {
      if (task) {
        await update.mutateAsync({ id: task.id, values })
      } else {
        const created = await create.mutateAsync(values)
        // One after the other, so they keep the order they were written in.
        for (const step of steps.filter(s => s.text.trim()))
          await workDAO.addStep(created.id, {
            text: step.text.trim(),
            assignee_id: step.assignee_id || null
          })
      }
      showToast('success', task ? 'Tarefa actualizada.' : 'Tarefa criada.')
      onClose()
    } catch (err) {
      showToast('error', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppModal
      isOpen
      onClose={onClose}
      variant="drawer"
      size="md"
      title={task ? 'Editar tarefa' : 'Nova tarefa'}
      description={
        task
          ? undefined
          : 'Escolha quem participa e diga o que cada pessoa faz.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {task ? 'Guardar alterações' : 'Criar tarefa'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5">
        <TextField
          label="Título"
          placeholder="Ex.: Testar o aplicativo mobile do passageiro"
          value={title}
          error={titleError}
          autoFocus
          maxLength={200}
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

        <PeoplePicker
          label="Pessoas"
          options={peopleOptions}
          value={people}
          onChange={choosePeople}
          disabled={ctx.level === 'member'}
          max={WORK_TASK_MAX_ASSIGNEES}
          hint={
            ctx.level === 'member'
              ? 'Como colaborador, cria tarefas só para si.'
              : ctx.level === 'manager'
                ? 'Pessoas do seu departamento.'
                : 'Pode juntar pessoas de vários departamentos.'
          }
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
              if (ctx.level === 'manager') choosePeople([])
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

        {!task && (
          <fieldset className="flex flex-col gap-3 border-t border-gray-200 pt-5 dark:border-gray-600">
            <legend className="sr-only">Passos</legend>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Quem faz o quê
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Opcional. Cada passo aparece na checklist da tarefa, para a
                pessoa saber o que é seu.
              </p>
            </div>
            {steps.map((step, i) => (
              <div key={step.key} className="flex flex-col gap-2 sm:flex-row">
                <input
                  aria-label={`Passo ${i + 1}`}
                  value={step.text}
                  maxLength={300}
                  placeholder="Ex.: testar o carregamento da carteira"
                  onChange={e =>
                    setSteps(s =>
                      s.map(x =>
                        x.key === step.key ? { ...x, text: e.target.value } : x
                      )
                    )
                  }
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-light px-3 py-2 text-sm text-dark placeholder:text-gray-400 focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200/30 dark:border-gray-600 dark:bg-baseBgDark dark:text-light"
                />
                <div className="flex gap-2">
                  <select
                    aria-label={`Para quem é o passo ${i + 1}`}
                    value={step.assignee_id}
                    onChange={e =>
                      setSteps(s =>
                        s.map(x =>
                          x.key === step.key
                            ? { ...x, assignee_id: e.target.value }
                            : x
                        )
                      )
                    }
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-light px-2 py-2 text-sm text-dark focus:border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-200/30 sm:w-44 sm:flex-none dark:border-gray-600 dark:bg-baseBgDark dark:text-light"
                  >
                    {people.map(id => (
                      <option key={id} value={id}>
                        {ctx.adminName(id)}
                      </option>
                    ))}
                    <option value="">Qualquer pessoa</option>
                  </select>
                  <button
                    type="button"
                    aria-label={`Tirar o passo ${i + 1}`}
                    onClick={() =>
                      setSteps(s => s.filter(x => x.key !== step.key))
                    }
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 dark:text-gray-400 dark:hover:bg-red-900/40 dark:hover:text-red-300"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
            <div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={14} aria-hidden />}
                onClick={() =>
                  setSteps(s => [
                    ...s,
                    {
                      key: Date.now(),
                      text: '',
                      // Round-robin, so a new step defaults to the next person.
                      assignee_id: people.length
                        ? people[s.length % people.length]
                        : ''
                    }
                  ])
                }
              >
                Acrescentar um passo
              </Button>
            </div>
          </fieldset>
        )}
      </form>
    </AppModal>
  )
}
