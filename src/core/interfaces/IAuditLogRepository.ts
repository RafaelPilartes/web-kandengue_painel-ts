// core/interfaces/IAuditLogRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { AuditLogInterface } from '@/interfaces/IAuditLog'

export interface IAuditLogRepository
  extends IBaseRepository<AuditLogInterface> {
  /**
   * The audit entries of one target (ride, driver, document), newest first.
   *
   * Its own query, **with no ordering on the server**: an equality on
   * `target_id` ordered by another field required a composite index that does
   * not exist. See `auditLog.dao.ts`.
   */
  getByTarget(targetId: string, max?: number): Promise<AuditLogInterface[]>
}
