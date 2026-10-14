import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseAuditLogDAO } =
  await import('@/modules/Api/firebase/auditLog.dao')
const { AppError } = await import('@/domain/errors/AppError')

const COLLECTION = 'auditLogs'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const baseLog = {
  admin_id: 'adm-1',
  admin_name: 'Rafael',
  admin_email: 'rafael@kandengue.ao',
  admin_role: 'general_management' as const,
  action: 'login' as const,
  module: 'auth' as const,
  description: 'Login bem-sucedido',
  severity: 'info' as const,
  ip_address: '127.0.0.1',
  user_agent: 'vitest',
  session_id: 'sess-1',
  success: true
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseAuditLogDAO', () => {
  let dao: InstanceType<typeof FirebaseAuditLogDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseAuditLogDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({ ...baseLog } as never)

    expect(created.id).toMatch(/^log-/)
    const found = await dao.getById(created.id)
    expect(found?.description).toBe('Login bem-sucedido')
  })

  it('created_at volta como Date, não como Timestamp', async () => {
    await seed('log-a', { ...baseLog, created_at: ts('2026-01-01') })

    const found = await dao.getById('log-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
  })

  // ─────────────── O que interessa: update e delete não passam ───────────────

  it('update lança AppError(failed-precondition) e não altera o registo', async () => {
    await seed('log-a', { ...baseLog, created_at: ts('2026-01-01') })

    await expect(
      dao.update('log-a', { description: 'alterado' } as never)
    ).rejects.toThrow(AppError)
    await expect(
      dao.update('log-a', { description: 'alterado' } as never)
    ).rejects.toMatchObject({ code: 'failed-precondition' })

    const snap = await getDoc(doc(testDb, `${COLLECTION}/log-a`))
    expect(snap.data()?.description).toBe('Login bem-sucedido')
  })

  it('delete lança AppError(failed-precondition) e não remove o registo', async () => {
    await seed('log-a', { ...baseLog, created_at: ts('2026-01-01') })

    await expect(dao.delete('log-a')).rejects.toThrow(AppError)
    await expect(dao.delete('log-a')).rejects.toMatchObject({
      code: 'failed-precondition'
    })

    const snap = await getDoc(doc(testDb, `${COLLECTION}/log-a`))
    expect(snap.exists()).toBe(true)
  })

  /*
   * ─────────── `getByTarget`: a query de um alvo (Fase 4) ───────────
   *
   * ⚠️ **Este teste não prova a parte que mais interessa, e di-lo.** O
   * emulador **não exige índices compostos**, por isso uma query com
   * `where + orderBy` passa aqui e falha em produção com
   * `failed-precondition` — foi assim que o motivo do fecho forçado
   * desapareceu do ecrã sem ninguém ver. O que isto prova é o contrato: filtra
   * pelo alvo, ordena do mais recente para o mais antigo, e respeita o tecto.
   * Que **não** há `orderBy` no servidor vê-se no código do DAO, não aqui.
   */
  it('devolve só as linhas do alvo, da mais recente para a mais antiga', async () => {
    await seed('log-a', {
      ...baseLog,
      target_id: 'rid-1',
      description: 'antiga',
      created_at: ts('2026-10-01T10:00:00Z')
    })
    await seed('log-b', {
      ...baseLog,
      target_id: 'rid-1',
      description: 'recente',
      created_at: ts('2026-10-14T10:00:00Z')
    })
    await seed('log-c', {
      ...baseLog,
      target_id: 'rid-2',
      description: 'de outra corrida',
      created_at: ts('2026-10-14T11:00:00Z')
    })

    const linhas = await dao.getByTarget('rid-1')
    expect(linhas.map(l => l.description)).toEqual(['recente', 'antiga'])
  })

  it('um alvo sem linhas devolve lista vazia, não erro', async () => {
    expect(await dao.getByTarget('rid-sem-nada')).toEqual([])
  })

  /*
   * ⚠️ **Uma linha gravada sem `created_at` não desaparece** — e um `orderBy`
   * no servidor tê-la-ia excluído (o `orderBy` do Firestore exclui documentos
   * sem o campo), que é outra razão para não o usar.
   *
   * O que ela leva é a data que o converter lhe dá (`toDate(...) ?? new
   * Date()`), por isso aparece **no topo** e não no fim: é "agora". Foi o que
   * este teste me mostrou quando o escrevi ao contrário — e fica assim,
   * porque o comportamento é o do converter e não o desta query.
   */
  it('uma linha gravada sem data entra na mesma, com a data do converter', async () => {
    await seed('log-a', {
      ...baseLog,
      target_id: 'rid-3',
      description: 'com data',
      created_at: ts('2026-10-14T10:00:00Z')
    })
    await seed('log-b', {
      ...baseLog,
      target_id: 'rid-3',
      description: 'sem data',
      created_at: null
    })

    const linhas = await dao.getByTarget('rid-3')
    expect(linhas).toHaveLength(2)
    expect(linhas.map(l => l.description).sort()).toEqual([
      'com data',
      'sem data'
    ])
    for (const l of linhas) expect(l.created_at).toBeInstanceOf(Date)
  })

  // ─────────── O caso característico desta task: sem searchField ───────────

  it('pesquisar lança AppError(failed-precondition) em vez de devolver vazio', async () => {
    await seed('log-a', { ...baseLog, created_at: ts('2026-01-01') })

    await expect(dao.getAll({ searchTerm: 'qualquer' })).rejects.toThrow(
      AppError
    )
    await expect(dao.getAll({ searchTerm: 'qualquer' })).rejects.toMatchObject(
      { code: 'failed-precondition' }
    )
  })
})
