import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { BaseFirebaseDAO } =
  await import('@/modules/Api/firebase/BaseFirebaseDAO')
const { VehicleEntity, vehicleConverter } =
  await import('@/core/entities/Vehicle')

const COLLECTION = 'test_vehicles'

class TestDAO extends BaseFirebaseDAO<InstanceType<typeof VehicleEntity>> {
  constructor() {
    super(COLLECTION, vehicleConverter, 'veh', 'plate')
  }
}

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

describe('BaseFirebaseDAO — leitura', () => {
  let dao: TestDAO

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new TestDAO()
  })

  it('getAll ordena por created_at desc por omissão', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-06-01') })
    await seed('veh-c', { plate: 'CCC', created_at: ts('2026-03-01') })

    const res = await dao.getAll()

    expect(res.data.map(v => v.id)).toEqual(['veh-b', 'veh-c', 'veh-a'])
  })

  it('getAll respeita orderBy e orderDirection', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-06-01') })

    const res = await dao.getAll({
      orderBy: 'created_at',
      orderDirection: 'asc'
    })

    expect(res.data.map(v => v.id)).toEqual(['veh-a', 'veh-b'])
  })

  it('getAll converte Timestamp em Date', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    const res = await dao.getAll()

    expect(res.data[0].created_at).toBeInstanceOf(Date)
  })

  it('getAll aplica filtros de igualdade', async () => {
    await seed('veh-a', {
      plate: 'AAA',
      status: 'validated',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'BBB',
      status: 'rejected',
      created_at: ts('2026-02-01')
    })

    const res = await dao.getAll({ filters: { status: 'validated' } })

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })

  it('getAll ignora filtros com valor undefined ou string vazia', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    const res = await dao.getAll({
      filters: { status: undefined, brand: '' } as never
    })

    expect(res.data).toHaveLength(1)
  })

  it('getAll pagina por cursor sem repetir nem saltar documentos', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-02-01') })
    await seed('veh-c', { plate: 'CCC', created_at: ts('2026-03-01') })

    const page1 = await dao.getAll({ limit: 2 })
    expect(page1.data.map(v => v.id)).toEqual(['veh-c', 'veh-b'])
    expect(page1.pagination?.hasMore).toBe(true)
    expect(page1.pagination?.cursor).toBe('veh-b')

    const page2 = await dao.getAll({
      limit: 2,
      after: page1.pagination?.cursor
    })
    expect(page2.data.map(v => v.id)).toEqual(['veh-a'])
    expect(page2.pagination?.hasMore).toBe(false)
  })

  it('getAll não devolve total por omissão, e devolve com withTotal', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'BBB', created_at: ts('2026-02-01') })

    expect((await dao.getAll({ limit: 1 })).pagination?.total).toBeUndefined()
    expect(
      (await dao.getAll({ limit: 1, withTotal: true })).pagination?.total
    ).toBe(2)
  })

  it('getAll devolve lista vazia em colecção vazia', async () => {
    const res = await dao.getAll()

    expect(res.data).toEqual([])
    expect(res.pagination?.hasMore).toBe(false)
    expect(res.pagination?.cursor).toBeNull()
  })

  it('getAll faz pesquisa por prefixo no searchField', async () => {
    await seed('veh-a', { plate: 'ld-11-11-aa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bg-22-22-bb', created_at: ts('2026-02-01') })

    const res = await dao.getAll({ searchTerm: 'LD-11' })

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })

  it('getById devolve a entidade e null quando não existe', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    expect((await dao.getById('veh-a'))?.plate).toBe('AAA')
    expect(await dao.getById('nao-existe')).toBeNull()
  })

  it('getAllByField filtra pelo campo indicado', async () => {
    await seed('veh-a', {
      plate: 'AAA',
      user_id: 'usr-1',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'BBB',
      user_id: 'usr-2',
      created_at: ts('2026-02-01')
    })

    const res = await dao.getAllByField('user_id', 'usr-1')

    expect(res.data.map(v => v.id)).toEqual(['veh-a'])
  })

  it('getOneByField devolve o primeiro resultado ou null', async () => {
    await seed('veh-a', { plate: 'AAA', created_at: ts('2026-01-01') })

    expect((await dao.getOneByField('plate', 'AAA'))?.id).toBe('veh-a')
    expect(await dao.getOneByField('plate', 'ZZZ')).toBeNull()
  })

  it('count devolve o total, com e sem filtros', async () => {
    await seed('veh-a', {
      plate: 'AAA',
      status: 'validated',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'BBB',
      status: 'rejected',
      created_at: ts('2026-02-01')
    })

    expect(await dao.count()).toBe(2)
    expect(await dao.count({ status: 'validated' })).toBe(1)
  })
})
