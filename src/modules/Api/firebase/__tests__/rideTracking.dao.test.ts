import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseRideTrackingDAO } =
  await import('@/modules/Api/firebase/rideTracking.dao')

const COLLECTION = 'rideTrackings'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const path = [
  { latitude: -8.83, longitude: 13.23, timestamp: ts('2026-01-01T10:00:00') },
  { latitude: -8.84, longitude: 13.24, timestamp: ts('2026-01-01T10:05:00') }
]

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseRideTrackingDAO', () => {
  let dao: InstanceType<typeof FirebaseRideTrackingDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseRideTrackingDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({ ride_id: 'rid-1', path } as never)

    expect(created.id).toMatch(/^rtck-/)
    const found = await dao.getById(created.id)
    expect(found?.ride_id).toBe('rid-1')
  })

  it('created_at volta como Date, não como Timestamp', async () => {
    await seed('rtck-a', {
      ride_id: 'rid-1',
      path,
      created_at: ts('2026-01-01')
    })

    const found = await dao.getById('rtck-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
  })

  it('cada ponto do path converte o seu próprio timestamp para Date', async () => {
    await seed('rtck-a', {
      ride_id: 'rid-1',
      path,
      created_at: ts('2026-01-01')
    })

    const found = await dao.getById('rtck-a')

    expect(found?.path).toHaveLength(2)
    for (const point of found?.path ?? []) {
      expect(point.timestamp).toBeInstanceOf(Date)
      expect(point.timestamp).not.toBeInstanceOf(Timestamp)
    }
  })

  it('update e delete funcionam', async () => {
    await seed('rtck-a', {
      ride_id: 'rid-1',
      path,
      created_at: ts('2026-01-01')
    })

    const updated = await dao.update('rtck-a', { ride_id: 'rid-2' })
    expect(updated.ride_id).toBe('rid-2')

    await dao.delete('rtck-a')
    expect(await dao.getById('rtck-a')).toBeNull()
  })

  // ─────────── Pesquisa por prefixo em ride_id — já era o campo certo ───────────

  it('pesquisa por prefixo em ride_id devolve resultados', async () => {
    await seed('rtck-a', {
      ride_id: 'rid-abc',
      path,
      created_at: ts('2026-01-01')
    })
    await seed('rtck-b', {
      ride_id: 'rid-xyz',
      path,
      created_at: ts('2026-01-02')
    })

    const res = await dao.getAll({ searchTerm: 'rid-abc' })

    expect(res.data.map(t => t.id)).toEqual(['rtck-a'])
  })
})
