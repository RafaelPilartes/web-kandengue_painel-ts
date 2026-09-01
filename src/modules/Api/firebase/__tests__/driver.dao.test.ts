import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseDriverDAO } =
  await import('@/modules/Api/firebase/driver.dao')

const COLLECTION = 'drivers'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const base = {
  name: 'João Manuel',
  phone: '+244900000000',
  status: 'active' as const,
  is_online: false
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseDriverDAO', () => {
  let dao: InstanceType<typeof FirebaseDriverDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseDriverDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      ...base,
      email: 'joao@example.com'
    } as never)

    expect(created.id).toMatch(/^dri-/)
    const found = await dao.getById(created.id)
    expect(found?.email).toBe('joao@example.com')
  })

  // ─────────── A armadilha do lote: datas herdadas de UserEntity ───────────

  it('CORRIGIDO: created_at, updated_at e last_login (herdados de UserEntity) voltam como Date', async () => {
    await seed('dri-a', {
      ...base,
      email: 'a@example.com',
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-02'),
      last_login: ts('2026-01-03')
    })

    const found = await dao.getById('dri-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
    expect(found?.updated_at).toBeInstanceOf(Date)
    expect(found?.updated_at).not.toBeInstanceOf(Timestamp)
    expect(found?.last_login).toBeInstanceOf(Date)
    expect(found?.last_login).not.toBeInstanceOf(Timestamp)
  })

  it('pesquisa por email (herdado) encontra por prefixo', async () => {
    await seed('dri-a', { ...base, email: 'joao@example.com', created_at: ts('2026-01-01') })
    await seed('dri-b', { ...base, email: 'bruno@example.com', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'joao@' })
    expect(res.data.map(d => d.id)).toEqual(['dri-a'])
  })

  it('getByEmail encontra o motorista', async () => {
    await seed('dri-a', { ...base, email: 'joao@example.com', created_at: ts('2026-01-01') })

    expect((await dao.getByEmail('joao@example.com'))?.id).toBe('dri-a')
  })

  it('getByEmail devolve null quando não existe (não lança)', async () => {
    expect(await dao.getByEmail('nao-existe@example.com')).toBeNull()
  })

  it('update e delete funcionam', async () => {
    await seed('dri-a', { ...base, email: 'a@x.com', created_at: ts('2026-01-01') })

    const updated = await dao.update('dri-a', { is_online: true })
    expect(updated.is_online).toBe(true)

    await dao.delete('dri-a')
    expect(await dao.getById('dri-a')).toBeNull()
  })

  it('softDelete marca status "deleted" mas mantém o documento (soft, não hard)', async () => {
    await seed('dri-a', { ...base, email: 'a@x.com', created_at: ts('2026-01-01') })

    await dao.softDelete('dri-a')

    const snap = await getDoc(doc(testDb, `${COLLECTION}/dri-a`))
    expect(snap.exists()).toBe(true)
    expect(snap.data()?.status).toBe('deleted')
  })

  it('listenOnlineDrivers emite apenas os motoristas online', async () => {
    await seed('dri-a', {
      ...base,
      email: 'a@x.com',
      is_online: true,
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-01')
    })
    await seed('dri-b', {
      ...base,
      email: 'b@x.com',
      is_online: false,
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-01')
    })

    const emitted = await new Promise<string[]>(resolve => {
      const unsubscribe = dao.listenOnlineDrivers(drivers => {
        unsubscribe()
        resolve(drivers.map(d => d.id))
      })
    })

    expect(emitted).toEqual(['dri-a'])
  })
})
