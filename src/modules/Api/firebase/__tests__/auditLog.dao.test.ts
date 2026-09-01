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
  admin_role: 'direcao_geral' as const,
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
