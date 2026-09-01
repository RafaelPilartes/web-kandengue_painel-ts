// modules/Api/firebase/auditLog.dao.ts
import type { IAuditLogRepository } from '@/core/interfaces/IAuditLogRepository'
import type { AuditLogInterface } from '@/interfaces/IAuditLog'
import { auditLogConverter } from '@/interfaces/IAuditLog'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { AppendOnlyDAO } from './AppendOnlyDAO'

export class FirebaseAuditLogDAO
  extends AppendOnlyDAO<AuditLogInterface>
  implements IAuditLogRepository
{
  constructor() {
    // Sem searchField: o DAO antigo nunca fez prefix-search — só filtros de
    // igualdade (admin_id, module, action, severity). `searchTerm` já era um
    // parâmetro morto; o motor agora lança em vez de o ignorar em silêncio.
    super(firebaseCollections.auditLogs.root, auditLogConverter, 'log')
  }
}
