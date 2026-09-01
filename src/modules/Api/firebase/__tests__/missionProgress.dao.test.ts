import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { collection, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore'
import { MissionProgressEntity } from '@/core/entities/MissionProgress'

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

  // ─── O teste que justifica esta task: upsert por ID composto ───

  it('updateProgress duas vezes com o mesmo par driver/missão actualiza o mesmo documento, não cria dois', async () => {
    const progress = new MissionProgressEntity({
      id: 'drv-1_miss-1',
      driver_id: 'drv-1',
      mission_id: 'miss-1',
      current_count: 1,
      completed_ride_ids: ['ride-1'],
      is_completed: false,
      is_paid: false
    })

    const first = await dao.updateProgress(progress)
    expect(first.id).toBe('drv-1_miss-1')

    const second = await dao.updateProgress({
      ...progress,
      current_count: 2,
      completed_ride_ids: ['ride-1', 'ride-2']
    } as MissionProgressEntity)
    expect(second.id).toBe('drv-1_miss-1')
    expect(second.current_count).toBe(2)

    const snap = await getDocs(collection(testDb, COLLECTION))
    expect(snap.docs).toHaveLength(1)
    expect(snap.docs[0].id).toBe('drv-1_miss-1')
    expect(snap.docs[0].data().current_count).toBe(2)
  })

  it('updateProgress calcula o ID composto quando a entidade não o traz', async () => {
    const progress = new MissionProgressEntity({
      id: '',
      driver_id: 'drv-2',
      mission_id: 'miss-2',
      current_count: 0,
      completed_ride_ids: [],
      is_completed: false,
      is_paid: false
    })

    const updated = await dao.updateProgress(progress)
    expect(updated.id).toBe('drv-2_miss-2')
    expect(await dao.getById('drv-2_miss-2')).not.toBeNull()
  })

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
