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
   * ─────────── `getByTarget`: one target's query (phase 4) ───────────
   *
   * ⚠️ **This test does not prove the part that matters most, and says so.**
   * The emulator **does not require composite indexes**, so a `where +
   * orderBy` query passes here and fails in production with
   * `failed-precondition` — which is how the forced-close reason vanished from
   * the screen with nobody noticing. What this proves is the contract: filter
   * by target, newest first, and respect the ceiling. That there is **no**
   * server-side `orderBy` is visible in the DAO's code, not here.
   */
  it('returns only the target entries, newest first', async () => {
    await seed('log-a', {
      ...baseLog,
      target_id: 'rid-1',
      description: 'older',
      created_at: ts('2026-10-01T10:00:00Z')
    })
    await seed('log-b', {
      ...baseLog,
      target_id: 'rid-1',
      description: 'newer',
      created_at: ts('2026-10-14T10:00:00Z')
    })
    await seed('log-c', {
      ...baseLog,
      target_id: 'rid-2',
      description: 'another ride',
      created_at: ts('2026-10-14T11:00:00Z')
    })

    const entries = await dao.getByTarget('rid-1')
    expect(entries.map(l => l.description)).toEqual(['newer', 'older'])
  })

  it('returns an empty list for a target with no entries, not an error', async () => {
    expect(await dao.getByTarget('rid-nothing')).toEqual([])
  })

  /*
   * ⚠️ **An entry stored without `created_at` does not disappear** — and a
   * server-side `orderBy` would have excluded it (Firestore's `orderBy` drops
   * documents without the field), which is another reason not to use one.
   *
   * What it carries is the date the converter gives it (`toDate(...) ?? new
   * Date()`), so it shows up **at the top** and not at the end: it is "now".
   * This test taught me that when I wrote it the other way round — and it
   * stays like this, because the behaviour belongs to the converter and not to
   * this query.
   */
  it('keeps an entry stored without a date, using the converter date', async () => {
    await seed('log-a', {
      ...baseLog,
      target_id: 'rid-3',
      description: 'with date',
      created_at: ts('2026-10-14T10:00:00Z')
    })
    await seed('log-b', {
      ...baseLog,
      target_id: 'rid-3',
      description: 'without date',
      created_at: null
    })

    const entries = await dao.getByTarget('rid-3')
    expect(entries).toHaveLength(2)
    expect(entries.map(l => l.description).sort()).toEqual([
      'with date',
      'without date'
    ])
    for (const l of entries) expect(l.created_at).toBeInstanceOf(Date)
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
