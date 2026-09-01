import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseApplicationDAO } =
  await import('@/modules/Api/firebase/application.dao')

const COLLECTION = 'applications'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const base = {
  first_name: 'Ana',
  last_name: 'Silva',
  phone: '+244900000000',
  province: 'Luanda',
  gender: 'F',
  status: 'pending' as const
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseApplicationDAO', () => {
  let dao: InstanceType<typeof FirebaseApplicationDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseApplicationDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      ...base,
      email: 'ana@example.com'
    } as never)

    expect(created.id).toMatch(/^appl-/)
    const found = await dao.getById(created.id)
    expect(found?.email).toBe('ana@example.com')
  })

  it('created_at e updated_at voltam como Date, não como Timestamp', async () => {
    await seed('appl-a', {
      ...base,
      email: 'a@example.com',
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-02')
    })

    const found = await dao.getById('appl-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
    expect(found?.updated_at).toBeInstanceOf(Date)
    expect(found?.updated_at).not.toBeInstanceOf(Timestamp)
  })

  it('getAll pagina e ordena por created_at desc', async () => {
    await seed('appl-a', { ...base, email: 'a@x.com', created_at: ts('2026-01-01') })
    await seed('appl-b', { ...base, email: 'b@x.com', created_at: ts('2026-06-01') })

    expect((await dao.getAll()).data.map(a => a.id)).toEqual([
      'appl-b',
      'appl-a'
    ])
  })

  it('pesquisa por email encontra por prefixo', async () => {
    await seed('appl-a', { ...base, email: 'ana@example.com', created_at: ts('2026-01-01') })
    await seed('appl-b', { ...base, email: 'bruno@example.com', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'ana@' })
    expect(res.data.map(a => a.id)).toEqual(['appl-a'])
  })

  it('getByEmail encontra a candidatura', async () => {
    await seed('appl-a', { ...base, email: 'ana@example.com', created_at: ts('2026-01-01') })

    expect((await dao.getByEmail('ana@example.com'))?.id).toBe('appl-a')
  })

  it('getByEmail devolve null quando não existe (não lança)', async () => {
    expect(await dao.getByEmail('nao-existe@example.com')).toBeNull()
  })

  it('update e delete funcionam', async () => {
    await seed('appl-a', { ...base, email: 'a@x.com', created_at: ts('2026-01-01') })

    const updated = await dao.update('appl-a', { status: 'approved' as never })
    expect(updated.status).toBe('approved')

    await dao.delete('appl-a')
    expect(await dao.getById('appl-a')).toBeNull()
  })
})
