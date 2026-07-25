// interfaces/IAuditLog.ts
import type { AdminRole, LogActionType } from '../types/enum'

export type AuditSeverity = 'info' | 'warning' | 'critical'

export type AuditModule =
  | 'auth'
  | 'passengers'
  | 'drivers'
  | 'admins'
  | 'applications'
  | 'rides'
  | 'realtime'
  | 'wallet'
  | 'topup_requests'
  | 'missions'
  | 'notifications'
  | 'metrics'
  | 'settings'
  | 'documents'
  | 'vehicles'
  | 'transactions'
  | 'promotions'
  | 'withdrawals'
  | 'system'

export interface AuditLocation {
  latitude?: number
  longitude?: number
  city?: string
  country?: string
}

export interface AuditLogInterface {
  id: string

  // Who
  admin_id: string
  admin_name: string
  admin_email: string
  admin_role: AdminRole

  // What
  action: LogActionType
  module: AuditModule
  description: string
  severity: AuditSeverity

  // Target
  target_id?: string
  target_type?: string
  target_label?: string

  // Change tracking
  previous_data?: Record<string, any>
  new_data?: Record<string, any>
  changed_fields?: string[]

  // Context
  ip_address: string
  user_agent: string
  session_id: string
  location?: AuditLocation

  // Outcome
  success: boolean
  error_message?: string

  // Timestamps
  created_at: Date
}

export interface AuditLogInput {
  action: LogActionType
  module: AuditModule
  description: string
  severity?: AuditSeverity
  target_id?: string
  target_type?: string
  target_label?: string
  previous_data?: Record<string, any>
  new_data?: Record<string, any>
  changed_fields?: string[]
  success?: boolean
  error_message?: string
}
