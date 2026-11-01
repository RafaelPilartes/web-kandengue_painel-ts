import type {
  AdminAccess,
  AdminPermission
} from '@rafaelpilartes/kandengue-shared/types'
import { useQuery } from '@tanstack/react-query'
import { adminAccessDAO } from '@/modules/Api/rest/adminAccess.dao'
import { useAdminStore } from '@/stores/userStore'

export const ACCESS_QUERY_KEY = ['admin-access'] as const

/*
 * One array, not a new `[]` per render: the menu memoises on this reference,
 * and a fresh literal would rebuild and re-measure the navigation on every
 * single render while the access is still loading.
 */
const NO_PERMISSIONS: AdminPermission[] = []

/**
 * The signed-in admin's level, department and permissions, from the API.
 * `can` is false while loading: a screen never flashes open and then closes.
 */
export function useAccess() {
  const adminId = useAdminStore(s => s.currentAdminData?.id)
  const query = useQuery({
    queryKey: [...ACCESS_QUERY_KEY, adminId],
    queryFn: adminAccessDAO.me,
    enabled: !!adminId,
    staleTime: 60_000
  })
  const permissions = query.data?.permissions ?? NO_PERMISSIONS
  /*
   * The same shape the API resolves, so the guards in the shared library can be
   * called with it as they are — `canEditAdminAccount` and
   * `canAssignAccessLevel` take an `AdminAccess`, and the panel must hide
   * exactly what the API refuses.
   */
  const access: AdminAccess = {
    isDirection: query.data?.is_direction === true,
    departmentId: query.data?.department?.id ?? null,
    profileId: query.data?.profile?.id ?? null,
    permissions
  }
  return {
    isLoading: query.isLoading,
    isError: query.isError,
    isDirection: access.isDirection,
    department: query.data?.department ?? null,
    profile: query.data?.profile ?? null,
    access,
    can: (permission: AdminPermission) => permissions.includes(permission)
  }
}
