import type { AdminPermission } from '@rafaelpilartes/kandengue-shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { ACCESS_QUERY_KEY } from '@/hooks/useAccess'
import {
  adminAccessDAO,
  type AdminRow,
  type CreateAdminBody,
  type DepartmentRow,
  type ProfileRow,
  type UpdateAdminBody
} from '@/modules/Api/rest/adminAccess.dao'

const DEPARTMENTS_KEY = ['departments'] as const
const DIRECTORY_KEY = ['admin-directory'] as const

/** Departments from the API, with create/update that refresh every access view. */
export function useDepartments() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: DEPARTMENTS_KEY,
    queryFn: adminAccessDAO.departments,
    staleTime: 60_000
  })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY })
    queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY })
  }
  const create = useMutation({
    mutationFn: adminAccessDAO.createDepartment,
    onSuccess: refresh
  })
  const update = useMutation({
    mutationFn: (v: {
      id: string
      values: Partial<{
        name: string
        permissions: AdminPermission[]
        active: boolean
      }>
    }) => adminAccessDAO.updateDepartment(v.id, v.values),
    onSuccess: refresh
  })
  const byId = useMemo(
    () => new Map((query.data ?? []).map(d => [d.id, d] as const)),
    [query.data]
  )
  return {
    departments: query.data ?? ([] as DepartmentRow[]),
    byId,
    isLoading: query.isLoading,
    create,
    update
  }
}

/** Every admin with department and level (the Firestore entity of lib 3.1 drops those fields). */
export function useAdminDirectory() {
  const query = useQuery({
    queryKey: DIRECTORY_KEY,
    queryFn: adminAccessDAO.admins,
    staleTime: 60_000
  })
  const byId = useMemo(
    () => new Map((query.data ?? []).map(a => [a.id, a] as const)),
    [query.data]
  )
  return {
    admins: query.data ?? ([] as AdminRow[]),
    byId,
    isLoading: query.isLoading
  }
}

const ADMINS_COLLECTION_KEY = [firebaseCollections.admins.root] as const

/** Everything that has to be refreshed after an admin changes. */
function useAdminRefresh() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: DIRECTORY_KEY })
    queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY })
    // The Firestore listing of the admins page, which reads the documents.
    queryClient.invalidateQueries({ queryKey: ADMINS_COLLECTION_KEY })
  }
}

/** Create an admin: the Auth account and the document, both in the API. */
export function useCreateAdmin() {
  const refresh = useAdminRefresh()
  return useMutation({
    mutationFn: (body: CreateAdminBody) => adminAccessDAO.createAdmin(body),
    onSuccess: refresh
  })
}

/** Name, phone, status and photo. The email is the Auth identity: not here. */
export function useUpdateAdminProfile() {
  const refresh = useAdminRefresh()
  return useMutation({
    mutationFn: (v: { adminId: string; values: UpdateAdminBody }) =>
      adminAccessDAO.updateAdmin(v.adminId, v.values),
    onSuccess: refresh
  })
}

export function useSetAdminAccess() {
  const refresh = useAdminRefresh()
  return useMutation({
    mutationFn: (v: {
      adminId: string
      department_id: string
      profile_id: string
    }) =>
      adminAccessDAO.setAccess(v.adminId, {
        department_id: v.department_id,
        profile_id: v.profile_id
      }),
    onSuccess: refresh
  })
}

const PROFILES_KEY = ['department-profiles'] as const

/**
 * The profiles of ONE department. The picker on the admin screen re-reads when
 * the chosen department changes, which is the behaviour the model asks for: a
 * profile only exists inside its department.
 */
export function useDepartmentProfiles(departmentId: string | null | undefined) {
  const query = useQuery({
    queryKey: [...PROFILES_KEY, departmentId],
    queryFn: () => adminAccessDAO.profiles(departmentId as string),
    enabled: !!departmentId,
    staleTime: 60_000
  })
  return {
    profiles: query.data ?? ([] as ProfileRow[]),
    isLoading: query.isLoading
  }
}

/** Create and update the profiles of a department. Direction only, in the API. */
export function useProfileMutations(departmentId: string | null | undefined) {
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: PROFILES_KEY })
    queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY })
  }
  const create = useMutation({
    mutationFn: (body: { name: string; permissions: AdminPermission[] }) =>
      adminAccessDAO.createProfile(departmentId as string, body),
    onSuccess: refresh
  })
  const update = useMutation({
    mutationFn: (v: {
      profileId: string
      values: Partial<{
        name: string
        permissions: AdminPermission[]
        active: boolean
      }>
    }) =>
      adminAccessDAO.updateProfile(
        departmentId as string,
        v.profileId,
        v.values
      ),
    onSuccess: refresh
  })
  return { create, update }
}

/** The Direction mark, on its own, because the API keeps it on its own route. */
export function useSetDirectionMark() {
  const refresh = useAdminRefresh()
  return useMutation({
    mutationFn: (v: { adminId: string; isDirection: boolean }) =>
      adminAccessDAO.setDirectionMark(v.adminId, v.isDirection),
    onSuccess: refresh
  })
}
