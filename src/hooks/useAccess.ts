import type { AdminPermission } from '@rafaelpilartes/kandengue-shared-v4/types'
import { useQuery } from '@tanstack/react-query'
import { adminAccessDAO } from '@/modules/Api/rest/adminAccess.dao'
import { useAdminStore } from '@/stores/userStore'

export const ACCESS_QUERY_KEY = ['admin-access'] as const

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
  const permissions = query.data?.permissions ?? []
  return {
    isLoading: query.isLoading,
    isError: query.isError,
    level: query.data?.level ?? null,
    department: query.data?.department ?? null,
    can: (permission: AdminPermission) => permissions.includes(permission)
  }
}
