import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseMissionProgressDAO } = await import(
  '@/modules/Api/firebase/missionProgress.dao'
)

const COLLECTION = 'missionProgress'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseMissionProgressDAO', () => {
  let dao: InstanceType<typeof FirebaseMissionProgressDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseMissionProgressDAO()
  })

  it('getProgress encontra pelo par driver_id/mission_id', async () => {
    await seed('drv-1_miss-1', {
      driver_id: 'drv-1',
      mission_id: 'miss-1',
      current_count: 2,
      completed_ride_ids: ['ride-1', 'ride-2'],
      is_completed: false,
      is_paid: false,
      last_updated: ts('2026-01-01')
    })

    const found = await dao.getProgress('drv-1', 'miss-1')
    expect(found?.current_count).toBe(2)
  })

  it('getProgress devolve null quando não existe', async () => {
    expect(await dao.getProgress('drv-x', 'miss-x')).toBeNull()
  })

  it('CORRIGIDO: last_updated volta como Date, não como Timestamp', async () => {
    await seed('drv-1_miss-1', {
      driver_id: 'drv-1',
      mission_id: 'miss-1',
      current_count: 1,
      completed_ride_ids: [],
      is_completed: false,
      is_paid: false,
      last_updated: ts('2026-01-01'),
      completed_at: ts('2026-01-02')
    })

    const found = await dao.getProgress('drv-1', 'miss-1')
    expect(found?.last_updated).toBeInstanceOf(Date)
    expect(found?.last_updated).not.toBeInstanceOf(Timestamp)
    expect(found?.completed_at).toBeInstanceOf(Date)
  })

  /*
   * ⚠️ **As escritas saíram deste DAO.** O `updateProgress` (upsert por ID
   * composto) passou para a API — `POST /api/v1/admin/drivers/:id/
   * mission-progress/recalculate` —, e as regras fecharam ao cliente os
   * campos que decidem pagamento, mais o `create` e o `delete`.
   *
   * Os testes que havia do upsert estão agora no
   * `mission-progress-admin.service.test.ts` da API, com a convenção do id
   * composto e a idempotência. **Não os reintroduzir aqui**: um teste que
   * escreve por este DAO passa contra o emulador (que o corre sem regras) e
   * descreve um caminho que produção nega.
   */

  it('getAllProgressByDriver devolve todo o progresso de um motorista', async () => {
    await seed('drv-1_miss-1', {
      driver_id: 'drv-1',
      mission_id: 'miss-1',
      current_count: 1,
      completed_ride_ids: [],
      is_completed: false,
      is_paid: false,
      last_updated: ts('2026-01-01')
    })
    await seed('drv-1_miss-2', {
      driver_id: 'drv-1',
      mission_id: 'miss-2',
      current_count: 3,
      completed_ride_ids: [],
      is_completed: false,
      is_paid: false,
      last_updated: ts('2026-01-02')
    })
    await seed('drv-2_miss-1', {
      driver_id: 'drv-2',
      mission_id: 'miss-1',
      current_count: 1,
      completed_ride_ids: [],
      is_completed: false,
      is_paid: false,
      last_updated: ts('2026-01-01')
    })

    const res = await dao.getAllProgressByDriver('drv-1')
    expect(res.map(p => p.id).sort()).toEqual(['drv-1_miss-1', 'drv-1_miss-2'])
  })
})
