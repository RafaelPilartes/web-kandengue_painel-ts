import {
  ADMIN_PERMISSION_GROUPS,
  ADMIN_PERMISSION_LABELS,
  DIRECTION_ONLY_PERMISSIONS
} from '@rafaelpilartes/kandengue-shared/constants'
import type { AdminPermission } from '@rafaelpilartes/kandengue-shared/types'
import { useState, type FormEvent } from 'react'
import { AppModal } from '@/components/modal/AppModal'
import { cn } from '@/lib/tailwind-merge'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/field'
import type { DepartmentRow } from '@/modules/Api/rest/adminAccess.dao'
import { showToast } from '@/utils/toasts'
import { useDepartments } from '@/viewModels/AccessViewModel'

// Admins and departments are Direction's alone, whatever a department holds.
const GROUPS = ADMIN_PERMISSION_GROUPS.map(g => ({
  ...g,
  permissions: g.permissions.filter(
    p => !DIRECTION_ONLY_PERMISSIONS.includes(p)
  )
})).filter(g => g.permissions.length)

export function DepartmentModal({
  department,
  onClose
}: {
  /** Absent: create a new one. */
  department?: DepartmentRow
  onClose: () => void
}) {
  const { create, update } = useDepartments()
  const [name, setName] = useState(department?.name ?? '')
  const [permissions, setPermissions] = useState<AdminPermission[]>(
    department?.permissions ?? []
  )
  const [nameError, setNameError] = useState<string>()
  const saving = create.isPending || update.isPending

  const toggle = (p: AdminPermission) =>
    setPermissions(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      setNameError('O nome tem de ter pelo menos 2 caracteres.')
      return
    }
    try {
      if (department) {
        await update.mutateAsync({
          id: department.id,
          values: { name: name.trim(), permissions }
        })
        showToast('success', 'Departamento actualizado.')
      } else {
        await create.mutateAsync({ name: name.trim(), permissions })
        showToast('success', 'Departamento criado.')
      }
      onClose()
    } catch (err) {
      showToast('error', (err as Error).message)
    }
  }

  return (
    <AppModal
      isOpen
      onClose={onClose}
      size="lg"
      title={department ? `Editar ${department.name}` : 'Novo departamento'}
      description="As permissões dizem o que os Gestores e Colaboradores deste departamento podem abrir no painel. A Direcção tem sempre todas."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="department-form" loading={saving}>
            {department ? 'Guardar alterações' : 'Criar departamento'}
          </Button>
        </>
      }
    >
      <form
        id="department-form"
        onSubmit={submit}
        className="flex flex-col gap-6"
      >
        <TextField
          label="Nome"
          placeholder="Ex.: Marketing"
          value={name}
          error={nameError}
          onChange={e => {
            setName(e.target.value)
            setNameError(undefined)
          }}
        />

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-200">
            Permissões
          </legend>
          {GROUPS.map(group => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-dark dark:text-light">
                {group.label}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.permissions.map(p => (
                  <label
                    key={p}
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm text-dark transition-colors dark:text-light',
                      permissions.includes(p)
                        ? 'border-primary-200/60 bg-primary-50/60 dark:border-primary-200/50 dark:bg-primary-900/30'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-400 text-primary-200 focus:ring-2 focus:ring-primary-200 dark:border-gray-500 dark:bg-baseBgDark"
                      checked={permissions.includes(p)}
                      onChange={() => toggle(p)}
                    />
                    {ADMIN_PERMISSION_LABELS[p]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
      </form>
    </AppModal>
  )
}
