// core/interfaces/IAuditLogRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { AuditLogInterface } from '@/interfaces/IAuditLog'

export interface IAuditLogRepository
  extends IBaseRepository<AuditLogInterface> {}
