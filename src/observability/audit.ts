// Observabilidade, não acesso a dados.
//
// Não é um usecase de propósito: tem estado mutável de sessão (`setAdmin`,
// chamado do login e do PrivateRoute), recolhe contexto do browser, e o
// `withAudit` é um decorador que os próprios usecases chamam para se
// registarem. Convertê-lo poria a camada a depender de si mesma.
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
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'

const auditLogDAO = new FirebaseAuditLogDAO()

const LEGACY_PAGE_SIZE = 50

/**
 * Traduz `offset` (paginação por registos saltados, como o DAO antigo fazia)
 * para o cursor por `id` que o `AppendOnlyDAO`/`BaseFirebaseDAO` espera.
 * Mesmo custo do código antigo: uma query extra de `offset` documentos.
 */
async function offsetToCursor(
  base: Omit<QueryOptions<AuditLogInterface>, 'limit' | 'after'>,
  offset: number
): Promise<string | undefined> {
  if (!offset) return undefined
  const skipped = await auditLogDAO.getAll({ ...base, limit: offset })
  return skipped.data[skipped.data.length - 1]?.id
}

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
          admin_role: 'general_management', // placeholder

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
    // `startDate`, `endDate` e `searchTerm` já eram parâmetros mortos no DAO
    // antigo — nunca entravam na query. Preservado aqui: só os filtros de
    // igualdade (admin_id, module, action, severity) chegam ao motor.
    const equalityFilters: Partial<AuditLogInterface> = {
      ...(filters?.admin_id ? { admin_id: filters.admin_id } : {}),
      ...(filters?.module ? { module: filters.module } : {}),
      ...(filters?.action ? { action: filters.action } : {}),
      ...(filters?.severity
        ? { severity: filters.severity as AuditLogInterface['severity'] }
        : {})
    }

    const base = { filters: equalityFilters }
    const after = await offsetToCursor(base, offset ?? 0)

    return auditLogDAO.getAll({
      ...base,
      limit: limit ?? LEGACY_PAGE_SIZE,
      after
    })
  }

  /**
   * As linhas de auditoria de **um alvo** (uma corrida, um motorista, um
   * documento), da mais recente para a mais antiga.
   *
   * ── Porque não passa pelo `getAll` ──
   * O `getAll` ordena sempre por `created_at`, e uma igualdade em `target_id`
   * com ordenação noutro campo **exige um índice composto** no Firestore: sem
   * ele a query falha com `failed-precondition`, e o ecrã perdia o motivo em
   * vez de o mostrar. Aqui pede-se **só a igualdade** — que o índice
   * automático de campo único já serve — e ordena-se **em memória**. É o
   * mesmo caminho que o relógio da 3.5 tomou na API, pela mesma razão: vinte
   * linhas de auditoria de uma corrida ordenam-se sem custo nenhum.
   *
   * ⚠️ **E por isso o `limite` é um tecto do que se lê, não dos mais
   * recentes**: sem ordenação no servidor, o Firestore devolve os primeiros
   * que encontrar. Para uma corrida há um punhado de linhas, e o tecto é uma
   * rede contra um alvo patológico — não um critério.
   */
  async getByTarget(
    targetId: string,
    limite = 50
  ): Promise<AuditLogInterface[]> {
    const { data } = await auditLogDAO.getAll({
      filters: { target_id: targetId } as Partial<AuditLogInterface>,
      orderBy: undefined,
      limit: limite
    })
    return [...data].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
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
