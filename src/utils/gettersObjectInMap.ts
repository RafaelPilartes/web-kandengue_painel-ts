import { adminRolePermissionsMap } from '../data/selectOption'
import type { OptionType } from '../types/option'

export function getPermissionsByRole(role: string): OptionType[] {
  return adminRolePermissionsMap[role] || []
}
