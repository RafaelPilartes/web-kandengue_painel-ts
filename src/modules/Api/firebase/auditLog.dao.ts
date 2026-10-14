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
   * As linhas de auditoria de **um alvo** — uma corrida, um motorista, um
   * documento.
   *
   * ── Porque não passa pelo `getAll`, e isto não é preferência ──
   * ⚠️ **Achado pela revisão independente da Fase 4.** O `getAll` do motor
   * **impõe sempre** um `orderBy` (`options.orderBy ?? defaultOrderField`):
   * passar-lhe `orderBy: undefined` não o desliga, cai no `created_at`. Uma
   * igualdade em `target_id` com ordenação noutro campo **exige um índice
   * composto** — e não há nenhum `auditLogs (target_id, created_at)` em
   * repositório nenhum. Em produção a query falhava com
   * `failed-precondition`, o `catch` de quem chama engolia-a, e o ecrã dizia
   * "sem motivo registado" com o motivo escrito na base de dados.
   *
   * **No emulador isto nunca aparece:** ele não exige índices compostos, por
   * isso a suite ficava verde.
   *
   * Aqui a query é **só a igualdade** — que o índice automático de campo único
   * já serve — e a ordenação faz-se **em memória**, como o relógio da 3.5 fez
   * na API pela mesma razão. Meia dúzia de linhas por alvo ordenam-se sem
   * custo; um índice é uma deploy e um ficheiro a manter.
   *
   * ⚠️ **O `limite` é um tecto do que se lê, não "os mais recentes"**: sem
   * ordenação no servidor, o Firestore devolve os primeiros que encontrar. É
   * uma rede contra um alvo patológico, não um critério.
   */
  async getByTarget(
    targetId: string,
    limite = 50
  ): Promise<AuditLogInterface[]> {
    const q = query(
      this.ref.withConverter(this.converter),
      where('target_id', '==', targetId),
      limit(limite)
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
