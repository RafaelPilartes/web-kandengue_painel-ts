import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseRideDAO } = await import('@/modules/Api/firebase/ride.dao')

const COLLECTION = 'rides'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const pickup = {
  description: 'Talatona',
  place_id: 'p1',
  latitude: -8.9,
  longitude: 13.18
}
const dropoff = {
  description: 'Ilha do Cabo',
  place_id: 'p2',
  latitude: -8.8,
  longitude: 13.23
}
const fare = {
  total: 2500,
  breakdown: {
    base_fare: 500,
    distance_cost: 1500,
    wait_cost: 300,
    insurance_fee: 200
  },
  payouts: { driver_earnings: 2000, company_earnings: 400, pension_fund: 100 }
}
const user = { name: 'Cliente Teste', email: 'cliente@kandengue.ao', phone: '900000000', status: 'active' }

const base = {
  user,
  pickup,
  dropoff,
  status: 'pending',
  distance: 5,
  duration: 10,
  fare,
  type: 'standard'
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseRideDAO', () => {
  let dao: InstanceType<typeof FirebaseRideDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseRideDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({ ...base } as never)

    expect(created.id).toMatch(/^rid-/)
    const found = await dao.getById(created.id)
    expect(found?.status).toBe('pending')
  })

  it('todas as seis datas voltam como Date, não como Timestamp', async () => {
    await seed('rid-a', {
      ...base,
      waiting_start_at: ts('2026-01-01T10:00:00'),
      waiting_end_at: ts('2026-01-01T10:05:00'),
      completed_at: ts('2026-01-01T10:30:00'),
      canceled_at: ts('2026-01-01T10:31:00'),
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-02')
    })

    const found = await dao.getById('rid-a')

    for (const field of [
      'waiting_start_at',
      'waiting_end_at',
      'completed_at',
      'canceled_at',
      'created_at',
      'updated_at'
    ] as const) {
      expect(found?.[field]).toBeInstanceOf(Date)
      expect(found?.[field]).not.toBeInstanceOf(Timestamp)
    }
  })

  it('update e delete funcionam', async () => {
    await seed('rid-a', { ...base, created_at: ts('2026-01-01') })

    const updated = await dao.update('rid-a', { status: 'completed' })
    expect(updated.status).toBe('completed')

    await dao.delete('rid-a')
    expect(await dao.getById('rid-a')).toBeNull()
  })

  // ─────────── O caso que motivou a Task 1: pesquisa em driver.email ───────────

  it('pesquisar por driver.email (campo aninhado) encontra a corrida seeded', async () => {
    await seed('rid-a', {
      ...base,
      driver: { name: 'Motorista A', email: 'joao.motorista@kandengue.ao' },
      created_at: ts('2026-01-01')
    })
    await seed('rid-b', {
      ...base,
      driver: { name: 'Motorista B', email: 'maria.motorista@kandengue.ao' },
      created_at: ts('2026-01-02')
    })

    const res = await dao.getAll({ searchTerm: 'joao.motorista' })

    expect(res.data.map(r => r.id)).toEqual(['rid-a'])
    expect(res.data[0].driver?.email).toBe('joao.motorista@kandengue.ao')
  })
})
