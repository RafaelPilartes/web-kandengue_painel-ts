// core/interfaces/IAuditLogRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { AuditLogInterface } from '@/interfaces/IAuditLog'

export interface IAuditLogRepository
  extends IBaseRepository<AuditLogInterface> {
  /**
   * As linhas de auditoria de um alvo (corrida, motorista, documento), da
   * mais recente para a mais antiga.
   *
   * Query própria, **sem ordenação no servidor**: a igualdade em `target_id`
   * com ordenação noutro campo exigia um índice composto que não existe. Ver
   * o `auditLog.dao.ts`.
   */
  getByTarget(targetId: string, limite?: number): Promise<AuditLogInterface[]>
}
