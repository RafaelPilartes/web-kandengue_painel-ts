import {
  WORK_PROJECT_STATUS_LABELS,
  WORK_PROJECT_STATUSES
} from '@rafaelpilartes/kandengue-shared/constants'
import type { WorkProjectStatus } from '@rafaelpilartes/kandengue-shared/types'
import { useId, useState, type FormEvent } from 'react'
import { AppModal } from '@/components/modal/AppModal'
import { Button } from '@/components/ui/button'
import { SelectField, TextAreaField, TextField } from '@/components/ui/field'
import type { WorkProject } from '@/modules/Api/rest/work.dao'
import { showToast } from '@/utils/toasts'
import { useWorkProjects } from '@/viewModels/WorkViewModel'
import { dueDateToIso, isoToDay, useWorkContext } from '../shared'

/** Create or edit a project, in the side panel. */
export function ProjectFormModal({
  project,
  onClose,
  onCreated
}: {
  project?: WorkProject
  onClose: () => void
  onCreated?: (id: string) => void
}) {
  const ctx = useWorkContext()
  const formId = useId()
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
      else {
        const { id } = await create.mutateAsync(values)
        onCreated?.(id)
      }
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
      variant="drawer"
      size="md"
      title={project ? 'Editar projecto' : 'Novo projecto'}
      description={
        project
          ? undefined
          : 'Um projecto junta as tarefas de uma mesma entrega, com um responsável e um prazo.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={create.isPending || update.isPending}
          >
            {project ? 'Guardar alterações' : 'Criar projecto'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-5">
        <TextField
          label="Nome"
          value={name}
          error={nameError}
          autoFocus
          maxLength={120}
          placeholder="Ex.: Campanha de Natal"
          onChange={e => {
            setName(e.target.value)
            setNameError(undefined)
          }}
        />
        <TextAreaField
          label="Descrição"
          placeholder="O objectivo, e como se sabe que está entregue."
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
      </form>
    </AppModal>
  )
}
