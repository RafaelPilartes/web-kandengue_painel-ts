import type {
  AdminGender,
  AdminPermission,
  AdminProfile
} from '@rafaelpilartes/kandengue-shared/types'
import ApiDAO from './Api.dao'

export type MyAccess = {
  is_direction: boolean
  department: { id: string; name: string } | null
  profile: { id: string; name: string } | null
  permissions: AdminPermission[]
}

export type ProfileRow = AdminProfile & { member_count: number }

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
  /*
   * ⚠️ There is no `password`. Nobody chooses an account's password and
   * nobody sees it: the API creates the account with one it discards, and the
   * person receives a link to set their own. Whoever created the account
   * could otherwise sign in as it.
   */
  status: AdminStatus
  photo?: string
  gender?: AdminGender
  department_id: string
  profile_id: string
}

export type UpdateAdminBody = Partial<{
  name: string
  phone: string
  status: AdminStatus
  photo: string
  /** `null` clears it: absent is neutral, and that has to be reachable. */
  gender: AdminGender | null
}>

export type AdminRow = {
  id: string
  name: string
  email: string
  department_id: string | null
  profile_id: string | null
  profile_name: string | null
  is_direction: boolean
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
    body: { department_id: string; profile_id: string }
  ) =>
    ApiDAO.patch<null>(
      `/api/v1/admin/admins/${encodeURIComponent(adminId)}/access`,
      body
    ),
  /*
   * The Direction mark is its own call, as it is its own route: it is the one
   * change that makes an account able to do everything.
   */
  setDirectionMark: (adminId: string, isDirection: boolean) =>
    ApiDAO.patch<null>(
      `/api/v1/admin/admins/${encodeURIComponent(adminId)}/direction`,
      { is_direction: isDirection }
    ),
  /*
   * This browser, for push. The admin id is the authenticated one, server
   * side: there is nothing in the body to get wrong.
   */
  registerDevice: (token: string) =>
    ApiDAO.post<{ registered: boolean }>('/api/v1/admin/devices', { token }),
  unregisterDevice: (token: string) =>
    ApiDAO.delete<null>('/api/v1/admin/devices', { token }),
  profiles: (departmentId: string) =>
    ApiDAO.get<ProfileRow[]>(
      `/api/v1/admin/departments/${encodeURIComponent(departmentId)}/profiles`
    ),
  createProfile: (
    departmentId: string,
    body: { name: string; permissions: AdminPermission[] }
  ) =>
    ApiDAO.post<{ id: string }>(
      `/api/v1/admin/departments/${encodeURIComponent(departmentId)}/profiles`,
      body
    ),
  updateProfile: (
    departmentId: string,
    profileId: string,
    body: Partial<{
      name: string
      permissions: AdminPermission[]
      active: boolean
    }>
  ) =>
    ApiDAO.patch<null>(
      `/api/v1/admin/departments/${encodeURIComponent(departmentId)}/profiles/${encodeURIComponent(profileId)}`,
      body
    )
}
