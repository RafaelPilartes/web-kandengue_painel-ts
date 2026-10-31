import type {
  AdminAccessLevel,
  AdminPermission
} from '@rafaelpilartes/kandengue-shared/types'
import ApiDAO from './Api.dao'

export type MyAccess = {
  level: AdminAccessLevel | null
  department: { id: string; name: string } | null
  permissions: AdminPermission[]
}

export type DepartmentRow = {
  id: string
  name: string
  permissions: AdminPermission[]
  active: boolean
  member_count: number
}

export type AdminStatus = 'active' | 'inactive' | 'pending'

export type CreateAdminBody = {
  name: string
  email: string
  phone: string
  password: string
  status: AdminStatus
  photo?: string
  department_id: string
  access_level: AdminAccessLevel
}

export type UpdateAdminBody = Partial<{
  name: string
  phone: string
  status: AdminStatus
  photo: string
}>

export type AdminRow = {
  id: string
  name: string
  email: string
  department_id: string | null
  access_level: AdminAccessLevel | null
}

/** Who may do what: the panel's side of /api/v1/admin/{me,departments,admins}. */
export const adminAccessDAO = {
  me: () => ApiDAO.get<MyAccess>('/api/v1/admin/me/access'),
  departments: () => ApiDAO.get<DepartmentRow[]>('/api/v1/admin/departments'),
  createDepartment: (body: { name: string; permissions: AdminPermission[] }) =>
    ApiDAO.post<{ id: string }>('/api/v1/admin/departments', body),
  updateDepartment: (
    id: string,
    body: Partial<{
      name: string
      permissions: AdminPermission[]
      active: boolean
    }>
  ) =>
    ApiDAO.patch<null>(
      `/api/v1/admin/departments/${encodeURIComponent(id)}`,
      body
    ),
  admins: () => ApiDAO.get<AdminRow[]>('/api/v1/admin/admins'),
  /*
   * Creating and editing an admin goes through the API: `/admins/{id}` is
   * `allow write: if false` in the Firestore rules, so the panel's own write
   * was simply denied — and the account used to be created in the browser with
   * `createUserWithEmailAndPassword`, which signed the current admin out.
   */
  createAdmin: (body: CreateAdminBody) =>
    ApiDAO.post<{ id: string }>('/api/v1/admin/admins', body),
  updateAdmin: (id: string, body: UpdateAdminBody) =>
    ApiDAO.patch<null>(`/api/v1/admin/admins/${encodeURIComponent(id)}`, body),
  setAccess: (
    adminId: string,
    body: { department_id: string; access_level: AdminAccessLevel }
  ) =>
    ApiDAO.patch<null>(
      `/api/v1/admin/admins/${encodeURIComponent(adminId)}/access`,
      body
    )
}
