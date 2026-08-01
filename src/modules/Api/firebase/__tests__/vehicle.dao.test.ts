import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseVehicleDAO } =
  await import('@/modules/Api/firebase/vehicle.dao')

const COLLECTION = 'vehicles'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseVehicleDAO', () => {
  let dao: InstanceType<typeof FirebaseVehicleDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseVehicleDAO()
  })

  it('aponta para a colecção vehicles', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })

    expect((await dao.getById('veh-a'))?.plate).toBe('ld-11-11-aa')
  })

  it('getAll ordena por created_at desc (igual ao legado)', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-06-01') })

    expect((await dao.getAll()).data.map(v => v.id)).toEqual(['veh-b', 'veh-a'])
  })

  it('getById devolve null quando não existe (igual ao legado)', async () => {
    expect(await dao.getById('nao-existe')).toBeNull()
  })

  it('getOneByField encontra por matrícula exacta (igual ao legado)', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })

    expect((await dao.getOneByField('plate', 'ld-11-11-aa'))?.id).toBe('veh-a')
  })

  it('create gera id com prefixo veh- (igual ao legado)', async () => {
    const created = await dao.create({
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'ld-33-33-cc',
      status: 'under_analysis'
    } as never)

    expect(created.id).toMatch(/^veh-/)
    expect((await dao.getById(created.id))?.plate).toBe('ld-33-33-cc')
  })

  it('update e delete funcionam (igual ao legado)', async () => {
    await seed('veh-a', {
      plate: 'aaa',
      status: 'under_analysis',
      created_at: ts('2026-01-01')
    })

    expect((await dao.update('veh-a', { status: 'validated' })).status).toBe(
      'validated'
    )

    await dao.delete('veh-a')
    expect(await dao.getById('veh-a')).toBeNull()
  })

  // ─────────── Os dois bugs da Task 2, agora corrigidos ───────────

  it('CORRIGIDO: created_at volta como Date, não como Timestamp', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const found = await dao.getById('veh-a')

    expect(found?.created_at).toBeInstanceOf(Date)
    expect(found?.created_at).not.toBeInstanceOf(Timestamp)
  })

  it('CORRIGIDO: a pesquisa por matrícula encontra o veículo', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bg-22-22-bb', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'LD-11' })

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })
})
