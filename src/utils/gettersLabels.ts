import {
  booleanOptions,
  genderOptions,
  statusOptions,
  userStatusOptions
} from '../data/selectOption'
import type {
  AdminRole,
  GenderType,
  StatusEnumType,
  UserStatus
} from '../types/enum'

export const getStatusLabel = (value: StatusEnumType): string => {
  const found = statusOptions.find(option => option.value === value)
  return found ? found.label : value
}
export const getUserStatusLabel = (value: UserStatus): string => {
  const found = userStatusOptions.find(option => option.value === value)
  return found ? found.label : value
}

export const getBooleanLabel = (value: string): string => {
  const found = booleanOptions.find(option => option.value === value)
  return found ? found.label : value
}

export function getGenderLabel(gender: GenderType): string {
  const found = genderOptions.find(option => option.value === gender)
  return found ? found.label : gender
}

export function getAdminRoleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    superadmin: 'Superadmin',
    manager: 'Gestor',
    finance: 'Financeiro',
    content: 'Conteúdo',
    support: 'Suporte'
  }
  return labels[role]
}
