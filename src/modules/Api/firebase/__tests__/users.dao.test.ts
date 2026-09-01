import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseUserDAO } = await import('@/modules/Api/firebase/users.dao')

const COLLECTION = 'users'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const base = {
  name: 'Ana Silva',
  phone: '+244900000000',
  status: 'active' as const
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseUserDAO', () => {
  let dao: InstanceType<typeof FirebaseUserDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseUserDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({ ...base, email: 'ana@example.com' } as never)

    expect(created.id).toMatch(/^us-/)
    const found = await dao.getById(created.id)
    expect(found?.email).toBe('ana@example.com')
  })

  it('created_at, updated_at e last_login voltam como Date, não como Timestamp', async () => {
    await seed('us-a', {
      ...base,
      email: 'a@example.com',
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-02'),
      last_login: ts('2026-01-03')
    })

    const found = await dao.getById('us-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
    expect(found?.updated_at).toBeInstanceOf(Date)
    expect(found?.updated_at).not.toBeInstanceOf(Timestamp)
    expect(found?.last_login).toBeInstanceOf(Date)
    expect(found?.last_login).not.toBeInstanceOf(Timestamp)
  })

  it('pesquisa por email encontra por prefixo', async () => {
    await seed('us-a', { ...base, email: 'ana@example.com', created_at: ts('2026-01-01') })
    await seed('us-b', { ...base, email: 'bruno@example.com', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'ana@' })
    expect(res.data.map(u => u.id)).toEqual(['us-a'])
  })

  it('getByEmail encontra o utilizador', async () => {
    await seed('us-a', { ...base, email: 'ana@example.com', created_at: ts('2026-01-01') })

    expect((await dao.getByEmail('ana@example.com'))?.id).toBe('us-a')
  })

  it('getByEmail devolve null quando não existe (não lança)', async () => {
    expect(await dao.getByEmail('nao-existe@example.com')).toBeNull()
  })

  it('update e delete funcionam', async () => {
    await seed('us-a', { ...base, email: 'a@x.com', created_at: ts('2026-01-01') })

    const updated = await dao.update('us-a', { name: 'Novo Nome' })
    expect(updated.name).toBe('Novo Nome')

    await dao.delete('us-a')
    expect(await dao.getById('us-a')).toBeNull()
  })

  it('softDelete marca status "deleted" mas mantém o documento (soft, não hard)', async () => {
    await seed('us-a', { ...base, email: 'a@x.com', created_at: ts('2026-01-01') })

    await dao.softDelete('us-a')

    const snap = await getDoc(doc(testDb, `${COLLECTION}/us-a`))
    expect(snap.exists()).toBe(true)
    expect(snap.data()?.status).toBe('deleted')
  })
})
