import type {
  AdminAccess,
  AdminPermission
} from '@rafaelpilartes/kandengue-shared/types'

/*
 * The one map of which permission each screen needs. The route guard and the
 * menu both read it, so a screen cannot be hidden in one place and open in the
 * other. First matching prefix wins: keep the specific paths above the general.
 * A path with no rule (the work module, 404) is open to every admin.
 */
const RULES: [prefix: string, permission: AdminPermission | AdminPermission[]][] = [
  ['/users/passengers', 'manage_passengers'],
  ['/users/drivers', 'manage_drivers'],
  /*
   * Two ways in, like the API route behind it: whoever manages accounts, and
   * whoever hands out profiles inside their own department. Naming only the
   * first hid the screen from the second — who then had a permission with
   * nowhere to use it.
   */
  ['/users/admins', ['manage_admins', 'manage_department_team']],
  ['/departments', 'manage_departments'],
  ['/applications', 'manage_applications'],
  ['/vehicles', 'manage_vehicles'],
  ['/rides/realtime', 'view_realtime_map'],
  ['/rides/fare-review', 'review_fares'],
  ['/rides', 'view_rides'],
  ['/finance/balances', 'manage_drivers'],
  ['/finance/reports', 'view_finance_reports'],
  ['/finance', 'manage_wallet'],
  ['/wallet/topup', 'manage_topup_requests'],
  ['/wallet', 'manage_wallet'],
  ['/missions', 'manage_missions'],
  ['/promotions', 'manage_promotions'],
  ['/referral', 'manage_referrals'],
  ['/pricing', 'manage_pricing'],
  ['/notifications', 'manage_notifications'],
  ['/metrics', 'view_metrics'],
  ['/settings', 'manage_settings'],
  ['/logs', 'view_audit_logs']
]

/** One permission, or several of which ANY ONE is enough. */
export function permissionFor(
  pathname: string
): AdminPermission | AdminPermission[] | null {
  /*
   * The home page is open to every admin since 2026-10-31. It carries the
   * greeting and the admin's own tasks and deadlines, which are worth opening
   * without any operational permission; the OPERATION's numbers on it are
   * still behind `view_dashboard`, checked where they are drawn.
   */
  if (pathname === '/') return null
  const rule = RULES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  return rule ? rule[1] : null
}

/** True when the admin holds the permission, or any one of several. */
export function holds(
  permission: AdminPermission | AdminPermission[],
  can: (p: AdminPermission) => boolean
): boolean {
  return Array.isArray(permission) ? permission.some(can) : can(permission)
}

type MenuItem = { to: string; subMenus?: MenuItem[] }

/** Drops the entries the admin cannot open, and a group left with no entries. */
export function filterMenu<T extends MenuItem>(
  items: T[],
  can: (p: AdminPermission) => boolean,
  access: Pick<AdminAccess, 'isDirection'> | null = null
): T[] {
  const allowed = (to: string) => {
    /*
     * Work reports used to follow the LEVEL (Direction or manager). The levels
     * are gone and the capability is a permission of its own — which is also
     * why this is no longer a special case worth a branch, except for the mark.
     */
    if (to === '/work/reports')
      return access?.isDirection === true || can('view_department_reports')
    const p = permissionFor(to)
    return p === null || holds(p, can)
  }
  return items.flatMap(item => {
    if (!item.subMenus) return allowed(item.to) ? [item] : []
    const subMenus = item.subMenus.filter(sub => allowed(sub.to))
    return subMenus.length ? [{ ...item, subMenus }] : []
  })
}
