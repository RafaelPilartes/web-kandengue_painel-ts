export type GenderEnumType = 'male' | 'female'
export type StatusEnumType = 'active' | 'inactive' | 'pending'
export type GenderType = 'male' | 'female' | 'other'
export type MonthEnumType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

// =========================================================================
export type UserStatus = 'active' | 'inactive' | 'pending' | 'banned'

// =========================================================================

export type AdminRole =
  | 'superadmin'
  | 'manager'
  | 'finance'
  | 'content'
  | 'support'

export type LogActionType =
  // Sessão e autenticação
  | 'login'
  | 'logout'

  // Ações CRUD
  | 'create'
  | 'read'
  | 'update'
  | 'delete'

  // Outros
  | 'access'
  | 'error'
  | 'custom'
