import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseMissionDAO } = await import('@/modules/Api/firebase/mission.dao')

const COLLECTION = 'missions'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseMissionDAO', () => {
  let dao: InstanceType<typeof FirebaseMissionDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseMissionDAO()
  })

  it('getById lê uma missão semeada', async () => {
    await seed('miss-a', {
      type: 'daily',
      target: 5,
      reward: 1000,
      is_active: true,
      created_at: ts('2026-01-01')
    })

    const found = await dao.getById('miss-a')
    expect(found?.target).toBe(5)
    expect(found?.created_at).toBeInstanceOf(Date)
  })

  it('getAll filtra por is_active (igual ao legado)', async () => {
    await seed('miss-a', {
      type: 'daily',
      target: 5,
      reward: 1000,
      is_active: true,
      created_at: ts('2026-01-01')
    })
    await seed('miss-b', {
      type: 'weekly',
      target: 20,
      reward: 5000,
      is_active: false,
      created_at: ts('2026-01-02')
    })

    const res = await dao.getAll({ filters: { is_active: true } })
    expect(res.data.map(m => m.id)).toEqual(['miss-a'])
  })

  it('create gera id com prefixo miss- e persiste', async () => {
    const created = await dao.create({
      type: 'monthly',
      target: 100,
      reward: 20000,
      is_active: true
    } as never)

    expect(created.id).toMatch(/^miss-/)
    expect((await dao.getById(created.id))?.target).toBe(100)
  })

  it('update e delete funcionam', async () => {
    await seed('miss-a', {
      type: 'daily',
      target: 5,
      reward: 1000,
      is_active: true,
      created_at: ts('2026-01-01')
    })

    expect((await dao.update('miss-a', { is_active: false })).is_active).toBe(
      false
    )

    await dao.delete('miss-a')
    expect(await dao.getById('miss-a')).toBeNull()
  })
})
