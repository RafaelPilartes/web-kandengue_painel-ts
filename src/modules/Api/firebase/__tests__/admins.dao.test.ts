import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseAdminDAO } =
  await import('@/modules/Api/firebase/admins.dao')

const COLLECTION = 'admins'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const base = {
  name: 'Maria Admin',
  phone: '+244900000000',
  status: 'active' as const,
  role: 'operations_quality' as const,
  permissions: []
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseAdminDAO', () => {
  let dao: InstanceType<typeof FirebaseAdminDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseAdminDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      ...base,
      email: 'maria@example.com'
    } as never)

    expect(created.id).toMatch(/^adm-/)
    const found = await dao.getById(created.id)
    expect(found?.email).toBe('maria@example.com')
  })

  // ─────────── A armadilha do lote: datas herdadas de UserEntity ───────────

  it('CORRIGIDO: created_at, updated_at e last_login (herdados de UserEntity) voltam como Date', async () => {
    await seed('adm-a', {
      ...base,
      email: 'a@example.com',
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-02'),
      last_login: ts('2026-01-03')
    })

    const found = await dao.getById('adm-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
    expect(found?.updated_at).toBeInstanceOf(Date)
    expect(found?.updated_at).not.toBeInstanceOf(Timestamp)
    expect(found?.last_login).toBeInstanceOf(Date)
    expect(found?.last_login).not.toBeInstanceOf(Timestamp)
  })

  // ─────────── A correcção silenciosa: ordenar por email na pesquisa ───────────

  it('CORRIGIDO: pesquisa por email (herdado) ordena e filtra pelo próprio email, não por created_at', async () => {
    await seed('adm-a', { ...base, email: 'maria@example.com', created_at: ts('2026-01-01') })
    await seed('adm-b', { ...base, email: 'bruno@example.com', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'maria@' })
    expect(res.data.map(a => a.id)).toEqual(['adm-a'])
  })

  it('getByEmail encontra o admin', async () => {
    await seed('adm-a', { ...base, email: 'maria@example.com', created_at: ts('2026-01-01') })

    expect((await dao.getByEmail('maria@example.com'))?.id).toBe('adm-a')
  })

  it('getByEmail devolve null quando não existe (não lança)', async () => {
    expect(await dao.getByEmail('nao-existe@example.com')).toBeNull()
  })

  it('update e delete funcionam', async () => {
    await seed('adm-a', { ...base, email: 'a@x.com', created_at: ts('2026-01-01') })

    const updated = await dao.update('adm-a', { name: 'Novo Nome' })
    expect(updated.name).toBe('Novo Nome')

    await dao.delete('adm-a')
    expect(await dao.getById('adm-a')).toBeNull()
  })
})
