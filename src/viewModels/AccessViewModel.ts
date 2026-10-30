import type {
  AdminAccessLevel,
  AdminPermission
} from '@rafaelpilartes/kandengue-shared-v4/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { ACCESS_QUERY_KEY } from '@/hooks/useAccess'
import {
  adminAccessDAO,
  type AdminRow,
  type DepartmentRow
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

export function useSetAdminAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      adminId: string
      department_id: string
      access_level: AdminAccessLevel
    }) =>
      adminAccessDAO.setAccess(v.adminId, {
        department_id: v.department_id,
        access_level: v.access_level
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIRECTORY_KEY })
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_KEY })
    }
  })
}
