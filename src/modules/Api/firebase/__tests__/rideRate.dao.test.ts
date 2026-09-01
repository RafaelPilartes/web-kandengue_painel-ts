import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseRideRateDAO } =
  await import('@/modules/Api/firebase/rideRate.dao')
const { AppError } = await import('@/domain/errors/AppError')

const COLLECTION = 'rideRates'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

const dayRates = {
  start_time: '06:00',
  end_time: '18:00',
  base_fare: 500,
  price_per_km: 100,
  wait_time_free_minutes: 3,
  price_per_minute: 20
}

const payouts = {
  driver_percent: 80,
  company_percent: 15,
  pension_fund_percent: 5
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseRideRateDAO', () => {
  let dao: InstanceType<typeof FirebaseRideRateDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseRideRateDAO()
  })

  it('create + getById fazem ida e volta', async () => {
    const created = await dao.create({
      day_rates: dayRates,
      night_rates: dayRates,
      insurance_percent: 5,
      payouts
    } as never)

    expect(created.id).toMatch(/^rate-/)
    const found = await dao.getById(created.id)
    expect(found?.insurance_percent).toBe(5)
  })

  it('updated_at volta como Date, não como Timestamp', async () => {
    await seed('rate-a', {
      day_rates: dayRates,
      night_rates: dayRates,
      insurance_percent: 5,
      payouts,
      created_at: ts('2026-01-01'),
      updated_at: ts('2026-01-02')
    })

    const found = await dao.getById('rate-a')

    expect(found?.updated_at).toBeInstanceOf(Date)
    expect(found?.updated_at).not.toBeInstanceOf(Timestamp)
  })

  it('update e delete funcionam', async () => {
    await seed('rate-a', {
      day_rates: dayRates,
      night_rates: dayRates,
      insurance_percent: 5,
      payouts,
      created_at: ts('2026-01-01')
    })

    const updated = await dao.update('rate-a', { insurance_percent: 8 })
    expect(updated.insurance_percent).toBe(8)

    await dao.delete('rate-a')
    expect(await dao.getById('rate-a')).toBeNull()
  })

  // ─────────── O caso característico desta task: sem searchField ───────────

  it('CORRIGIDO: pesquisar lança AppError(failed-precondition) em vez de devolver vazio', async () => {
    await seed('rate-a', {
      day_rates: dayRates,
      night_rates: dayRates,
      insurance_percent: 5,
      payouts,
      created_at: ts('2026-01-01')
    })

    await expect(dao.getAll({ searchTerm: 'qualquer' })).rejects.toThrow(
      AppError
    )
    await expect(dao.getAll({ searchTerm: 'qualquer' })).rejects.toMatchObject(
      { code: 'failed-precondition' }
    )
  })
})
