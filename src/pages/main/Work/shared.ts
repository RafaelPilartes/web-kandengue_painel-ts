import type { WorkTaskPriority } from '@rafaelpilartes/kandengue-shared-v4/types'
import { useMemo } from 'react'
import type { BadgeTone } from '@/components/ui/badge'
import { useAccess } from '@/hooks/useAccess'
import type { WorkTask } from '@/modules/Api/rest/work.dao'
import { useAdminStore } from '@/stores/userStore'
import { useAdminDirectory, useDepartments } from '@/viewModels/AccessViewModel'

export const PRIORITY_TONE: Record<WorkTaskPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger'
}

/** A due date picked as a day is the end of that day in Angola (UTC+1). */
export const dueDateToIso = (day: string) =>
  day ? new Date(`${day}T23:59:00+01:00`).toISOString() : null

export const isoToDay = (iso: string | null) =>
  iso
    ? new Date(new Date(iso).getTime() + 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10)
    : ''

export const formatDay = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('pt-AO', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Africa/Luanda'
      }).format(new Date(iso))
    : '—'

export const isOverdue = (
  t: Pick<WorkTask, 'due_date' | 'status'>,
  now = new Date()
) => t.status !== 'done' && !!t.due_date && new Date(t.due_date) < now

/** Who the admin is in the module, and the names to show for ids. */
export function useWorkContext() {
  const access = useAccess()
  const meId = useAdminStore(s => s.currentAdminData?.id) ?? ''
  const { admins } = useAdminDirectory()
  const { departments } = useDepartments()
  const adminName = useMemo(
    () => new Map(admins.map(a => [a.id, a.name])),
    [admins]
  )
  const departmentName = useMemo(
    () => new Map(departments.map(d => [d.id, d.name])),
    [departments]
  )
  const level = access.level
  const myDepartment = access.department?.id ?? null

  return {
    meId,
    level,
    myDepartment,
    admins,
    departments,
    adminName: (id: string | null) =>
      id ? (adminName.get(id) ?? 'Desconhecido') : 'Sem responsável',
    departmentName: (id: string) => departmentName.get(id) ?? id,
    /** Mirrors the API's canEditTask; the API decides, this only hides buttons. */
    canEdit: (t: WorkTask) =>
      level === 'direction' ||
      (level === 'manager' && t.department_id === myDepartment) ||
      (level === 'member' && t.created_by === meId && t.status !== 'done'),
    canManageProjects: level === 'direction' || level === 'manager',
    canSeeReports: level === 'direction' || level === 'manager'
  }
}
