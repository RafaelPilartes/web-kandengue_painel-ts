// modules/Api/firebase/auditLog.dao.ts
import type { IAuditLogRepository } from '@/core/interfaces/IAuditLogRepository'
import type { AuditLogInterface } from '@/interfaces/IAuditLog'
import { auditLogConverter } from '@/interfaces/IAuditLog'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { AppendOnlyDAO } from './AppendOnlyDAO'
import { getDocs, limit, query, where } from 'firebase/firestore'

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

  /**
   * The audit entries of **one target** — a ride, a driver, a document.
   *
   * ── Why it does not go through `getAll`, and this is not a preference ──
   * ⚠️ **Found by the independent review of phase 4.** The engine's `getAll`
   * **always imposes** an `orderBy` (`options.orderBy ?? defaultOrderField`):
   * passing it `orderBy: undefined` does not switch it off, it falls back to
   * `created_at`. An equality on `target_id` ordered by another field
   * **requires a composite index** — and there is no
   * `auditLogs (target_id, created_at)` in any repository. In production the
   * query failed with `failed-precondition`, the caller's `catch` swallowed
   * it, and the screen said "no reason on record" with the reason sitting in
   * the database.
   *
   * **This never shows up on the emulator:** it does not require composite
   * indexes, so the suite stayed green.
   *
   * Here the query is **the equality only** — which the automatic single-field
   * index already serves — and the ordering happens **in memory**, as the 3.5
   * scheduler did on the API for the same reason. Half a dozen entries per
   * target sort for free; an index is a deploy and a file to maintain.
   *
   * ⚠️ **`max` is a ceiling on what is read, not "the most recent"**: with no
   * ordering on the server, Firestore returns whichever it finds first. It is
   * a net against a pathological target, not a criterion.
   */
  async getByTarget(targetId: string, max = 50): Promise<AuditLogInterface[]> {
    const q = query(
      this.ref.withConverter(this.converter),
      where('target_id', '==', targetId),
      limit(max)
    )
    const snap = await getDocs(q)
    return snap.docs
      .map(d => d.data())
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
  }
}
