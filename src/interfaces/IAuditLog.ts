// interfaces/IAuditLog.ts
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import { toDate } from '@/helpers/firestore'
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

/**
 * Forma crua do documento em `auditLogs`, tal como o Firestore o devolve.
 * Difere de `AuditLogInterface` só em `created_at`, que aqui é `Timestamp`.
 */
export interface AuditLogDoc extends Omit<AuditLogInterface, 'created_at'> {
  created_at?: Timestamp | Date | null
}

/**
 * Fronteira única entre o documento Firestore e a aplicação.
 * `AuditLogInterface` não é uma classe — é uma interface simples — por isso
 * o converter vive aqui, junto do tipo, em vez de em `core/entities`.
 */
export const auditLogConverter: FirestoreDataConverter<AuditLogInterface> = {
  toFirestore(log) {
    return { ...log }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as AuditLogDoc
    return {
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at) ?? new Date()
    } as AuditLogInterface
  }
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
