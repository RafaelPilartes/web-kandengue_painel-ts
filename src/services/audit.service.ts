// services/audit.service.ts
import { FirebaseAuditLogDAO } from '@/modules/Api/firebase/auditLog.dao'
import type {
  AuditLogInterface,
  AuditLogInput,
  AuditLocation,
  AuditModule
} from '@/interfaces/IAuditLog'
import type { AdminInterface } from '@/interfaces/IAdmin'
import type { LogActionType } from '@/types/enum'
import type { ListResponseType } from '@/interfaces/IApiResponse'

const auditLogDAO = new FirebaseAuditLogDAO()

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('audit_session_id')
  if (!sessionId) {
    sessionId = `sess-${Date.now()}_${Math.floor(Math.random() * 10000)}`
    sessionStorage.setItem('audit_session_id', sessionId)
  }
  return sessionId
}

function stripSensitiveFields(data: any): any {
  if (data === null || data === undefined) return data
  if (data instanceof Date) return data
  if (Array.isArray(data)) {
    return data.map(item => stripSensitiveFields(item))
  }
  if (typeof data === 'object') {
    const stripped: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (['password', 'token', 'secret', 'senha'].includes(key.toLowerCase())) {
        stripped[key] = '[REDACTED]'
      } else {
        stripped[key] = stripSensitiveFields(value)
      }
    }
    return stripped
  }
  return data
}

async function getSessionLocation(): Promise<AuditLocation | undefined> {
  const cached = sessionStorage.getItem('audit_location')
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // ignore
    }
  }

  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve(undefined)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        const location: AuditLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }

        // Try reverse geocoding via free API
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`,
            { signal: AbortSignal.timeout(3000) }
          )
          if (res.ok) {
            const geo = await res.json()
            location.city =
              geo.address?.city || geo.address?.town || geo.address?.village
            location.country = geo.address?.country
          }
        } catch {
          // geocoding is best-effort
        }

        sessionStorage.setItem('audit_location', JSON.stringify(location))
        resolve(location)
      },
      () => resolve(undefined),
      { timeout: 5000, maximumAge: 300000 }
    )
  })
}

function getIpAddress(): string {
  // IP is best-effort on client-side; returns placeholder
  return sessionStorage.getItem('audit_ip') || 'client'
}

async function fetchAndCacheIp(): Promise<void> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000)
    })
    if (res.ok) {
      const data = await res.json()
      sessionStorage.setItem('audit_ip', data.ip)
    }
  } catch {
    // best-effort
  }
}

export class AuditService {
  private admin: AdminInterface | null = null

  setAdmin(admin: AdminInterface | null) {
    this.admin = admin
  }

  async initialize() {
    await Promise.all([fetchAndCacheIp(), getSessionLocation()])
  }

  async log(input: AuditLogInput): Promise<void> {
    if (!this.admin) {
      console.warn('[AuditService] No admin set, skipping audit log')
      return
    }

    try {
      const location = await getSessionLocation()

      const logEntry: Omit<AuditLogInterface, 'id'> = {
        admin_id: this.admin.id || '',
        admin_name: this.admin.name || '',
        admin_email: this.admin.email || '',
        admin_role: this.admin.role,

        action: input.action,
        module: input.module,
        description: input.description,
        severity: input.severity || 'info',

        target_id: input.target_id,
        target_type: input.target_type,
        target_label: input.target_label,

        previous_data: stripSensitiveFields(input.previous_data),
        new_data: stripSensitiveFields(input.new_data),
        changed_fields: input.changed_fields,

        ip_address: getIpAddress(),
        user_agent: navigator.userAgent,
        session_id: getSessionId(),
        location,

        success: input.success ?? true,
        error_message: input.error_message,

        created_at: new Date()
      }

      await auditLogDAO.create(logEntry)
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err)
    }
  }

  async logLogin(success: boolean, email: string, errorMessage?: string) {
    // For login, admin might not be set yet
    const partial: AuditLogInput = {
      action: 'login',
      module: 'auth',
      description: success
        ? `Login bem-sucedido: ${email}`
        : `Tentativa de login falhada: ${email}`,
      severity: success ? 'info' : 'warning',
      target_type: 'admin',
      target_label: email,
      success,
      error_message: errorMessage
    }

    // If admin is not set (login attempt), create a minimal entry
    if (!this.admin) {
      try {
        const location = await getSessionLocation()
        const logEntry: Omit<AuditLogInterface, 'id'> = {
          admin_id: 'unknown',
          admin_name: email,
          admin_email: email,
          admin_role: 'direcao_geral', // placeholder

          action: partial.action,
          module: partial.module,
          description: partial.description,
          severity: partial.severity || 'info',

          target_type: partial.target_type,
          target_label: partial.target_label,

          ip_address: getIpAddress(),
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          location,

          success: partial.success ?? false,
          error_message: partial.error_message,

          created_at: new Date()
        }
        await auditLogDAO.create(logEntry)
      } catch (err) {
        console.error('[AuditService] Failed to log login attempt:', err)
      }
      return
    }

    await this.log(partial)
  }

  async logLogout() {
    await this.log({
      action: 'logout',
      module: 'auth',
      description: `Logout: ${this.admin?.email}`,
      severity: 'info'
    })
  }

  async getAll(
    limit?: number,
    offset?: number,
    filters?: {
      admin_id?: string
      module?: AuditModule
      action?: LogActionType
      severity?: string
      startDate?: Date
      endDate?: Date
      searchTerm?: string
    }
  ): Promise<ListResponseType<AuditLogInterface[]>> {
    return auditLogDAO.getAll(limit, offset, filters)
  }
}

// Singleton instance
export const auditService = new AuditService()

/**
 * Helper: wraps an async action with audit logging.
 * Logs success or error automatically.
 */
export async function withAudit<T>(
  fn: () => Promise<T>,
  input: AuditLogInput
): Promise<T> {
  try {
    const result = await fn()
    await auditService.log({ ...input, success: true })
    return result
  } catch (error: any) {
    await auditService.log({
      ...input,
      success: false,
      severity: 'critical',
      error_message: error.message || 'Erro desconhecido'
    })
    throw error
  }
}
