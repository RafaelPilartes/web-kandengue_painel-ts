import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

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

const NEW_VEHICLE = {
  user_id: 'usr-1',
  type: 'car',
  brand: 'Toyota',
  model: 'Corolla',
  color: 'preto',
  plate: 'ld-11-11-aa',
  status: 'under_analysis'
} as never

describe('BaseFirebaseDAO — escrita', () => {
  let dao: TestDAO

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new TestDAO()
  })

  it('create gera um id com o prefixo do DAO', async () => {
    const created = await dao.create(NEW_VEHICLE)

    expect(created.id).toMatch(/^veh-/)
  })

  it('create aceita um id explícito', async () => {
    const created = await dao.create(NEW_VEHICLE, 'veh-fixo')

    expect(created.id).toBe('veh-fixo')
  })

  it('create grava o id também dentro do documento', async () => {
    const created = await dao.create(NEW_VEHICLE)

    const raw = await getDoc(doc(testDb, `${COLLECTION}/${created.id}`))

    expect(raw.data()?.id).toBe(created.id)
  })

  it('create devolve created_at como Date resolvida pelo servidor', async () => {
    const created = await dao.create(NEW_VEHICLE)

    expect(created.created_at).toBeInstanceOf(Date)
    // O DAO grava `null`; o converter normaliza para `undefined`.
    expect(created.updated_at).toBeUndefined()
  })

  it('create descarta campos undefined em vez de rebentar', async () => {
    const created = await dao.create({
      ...(NEW_VEHICLE as object),
      image: undefined
    } as never)

    expect(created.image).toBeUndefined()
  })

  it('create preserva valores null', async () => {
    await dao.create(
      { ...(NEW_VEHICLE as object), image: null } as never,
      'veh-null'
    )

    const raw = await getDoc(doc(testDb, `${COLLECTION}/veh-null`))

    expect(raw.data()?.image).toBeNull()
  })

  it('update altera o campo e preenche updated_at', async () => {
    await dao.create(NEW_VEHICLE, 'veh-a')

    const updated = await dao.update('veh-a', { status: 'validated' })

    expect(updated.status).toBe('validated')
    expect(updated.updated_at).toBeInstanceOf(Date)
  })

  it('update não deixa alterar id nem created_at', async () => {
    await setDoc(doc(testDb, `${COLLECTION}/veh-a`), {
      id: 'veh-a',
      plate: 'aaa',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const updated = await dao.update('veh-a', {
      id: 'veh-hackeado',
      created_at: new Date('2030-01-01'),
      status: 'validated'
    } as never)

    expect(updated.id).toBe('veh-a')
    expect(updated.created_at).toEqual(new Date('2026-01-01'))
  })

  it('update falha com AppError quando o documento não existe', async () => {
    // A `message` é a que o utilizador lê — sem o contexto lá dentro.
    // O contexto continua a existir, à parte, para quem diagnostica.
    await expect(
      dao.update('nao-existe', { status: 'validated' })
    ).rejects.toMatchObject({
      code: 'not-found',
      message: 'Registo não encontrado.',
      context: '[test_vehicles.update]'
    })
  })

  it('delete remove o documento', async () => {
    await dao.create(NEW_VEHICLE, 'veh-a')

    await dao.delete('veh-a')

    expect(await dao.getById('veh-a')).toBeNull()
  })
})
