import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi
} from 'vitest'
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

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

/** Expõe o helper protegido para se poderem testar as duas ramificações.
 *  Um erro real de stream não é accionável a partir deste repo — dependeria
 *  das Security Rules — e `doc(ref, '')` rebenta antes do `onSnapshot`. */
class ErrorProbeDAO extends BaseFirebaseDAO<InstanceType<typeof VehicleEntity>> {
  constructor() {
    super(COLLECTION, vehicleConverter, 'veh', 'plate')
  }

  probe(op: string, err: unknown, onError?: (e: Error) => void): void {
    this.onListenError(op, err, onError)
  }
}

const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

/** Espera até `predicate` ser verdadeiro ou rebentar por timeout. */
async function waitFor(predicate: () => boolean, timeoutMs = 5000) {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeoutMs)
      throw new Error('timeout à espera do snapshot')
    await new Promise(r => setTimeout(r, 25))
  }
}

describe('BaseFirebaseDAO — realtime', () => {
  let dao: TestDAO
  let probe: ErrorProbeDAO
  const unsubs: Array<() => void> = []

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new TestDAO()
    probe = new ErrorProbeDAO()
  })

  afterEach(() => {
    unsubs.splice(0).forEach(u => u())
  })

  it('listenById emite o estado inicial e cada alteração', async () => {
    await seed('veh-a', {
      plate: 'aaa',
      status: 'under_analysis',
      created_at: ts('2026-01-01')
    })

    const seen: Array<string | undefined> = []
    unsubs.push(dao.listenById('veh-a', v => seen.push(v?.status)))

    await waitFor(() => seen.length === 1)
    await updateDoc(doc(testDb, `${COLLECTION}/veh-a`), { status: 'validated' })
    await waitFor(() => seen.length === 2)

    expect(seen).toEqual(['under_analysis', 'validated'])
  })

  it('listenById emite null quando o documento é apagado', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const seen: Array<unknown> = []
    unsubs.push(dao.listenById('veh-a', v => seen.push(v)))

    await waitFor(() => seen.length === 1)
    await deleteDoc(doc(testDb, `${COLLECTION}/veh-a`))
    await waitFor(() => seen.length === 2)

    expect(seen[1]).toBeNull()
  })

  it('listenAll emite a lista completa a cada alteração', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const seen: string[][] = []
    unsubs.push(dao.listenAll(list => seen.push(list.map(v => v.id))))

    await waitFor(() => seen.length === 1)
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })
    await waitFor(() => seen.length === 2)

    expect(seen[0]).toEqual(['veh-a'])
    expect(seen[1]).toEqual(['veh-b', 'veh-a'])
  })

  it('listenAll reage a updates E a deletes', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })

    const seen: string[][] = []
    unsubs.push(dao.listenAll(list => seen.push(list.map(v => v.id))))

    await waitFor(() => seen.length === 1)
    await deleteDoc(doc(testDb, `${COLLECTION}/veh-b`))
    await waitFor(() => seen.length === 2)

    expect(seen[1]).toEqual(['veh-a'])
  })

  it('listenAll aplica o limite', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })
    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })
    await seed('veh-c', { plate: 'ccc', created_at: ts('2026-03-01') })

    const seen: string[][] = []
    unsubs.push(
      dao.listenAll(list => seen.push(list.map(v => v.id)), undefined, {
        limit: 2
      })
    )

    await waitFor(() => seen.length === 1)

    expect(seen[0]).toEqual(['veh-c', 'veh-b'])
  })

  it('listenAllByField filtra pelo campo', async () => {
    await seed('veh-a', {
      plate: 'aaa',
      user_id: 'usr-1',
      created_at: ts('2026-01-01')
    })
    await seed('veh-b', {
      plate: 'bbb',
      user_id: 'usr-2',
      created_at: ts('2026-02-01')
    })

    const seen: string[][] = []
    unsubs.push(
      dao.listenAllByField('user_id', 'usr-1', list =>
        seen.push(list.map(v => v.id))
      )
    )

    await waitFor(() => seen.length === 1)

    expect(seen[0]).toEqual(['veh-a'])
  })

  it('onListenError chama o onError quando existe, sem escrever na consola', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const received: Error[] = []
    try {
      probe.probe('listenAll', { code: 'firestore/permission-denied' }, e =>
        received.push(e)
      )
      expect(received).toHaveLength(1)
      expect((received[0] as { code?: string }).code).toBe('permission-denied')
      expect(spy).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
  })

  it('onListenError regista na consola quando não há onError', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      probe.probe('listenAll', { code: 'firestore/permission-denied' })

      // Sem isto o erro desaparecia por completo e o listener morria em
      // silêncio — a UI apenas deixava de actualizar.
      expect(spy).toHaveBeenCalledTimes(1)
      // O contexto saiu da `message` — essa é para o utilizador — mas no
      // registo tem de continuar a aparecer, ou não se sabe qual listener
      // morreu.
      expect(String(spy.mock.calls[0][0])).toContain('[test_vehicles.listenAll]')
      expect(String(spy.mock.calls[0][0])).toContain('Não tem permissão')
    } finally {
      spy.mockRestore()
    }
  })

  it('o unsubscribe pára de emitir', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    const seen: string[][] = []
    const unsubscribe = dao.listenAll(list => seen.push(list.map(v => v.id)))

    await waitFor(() => seen.length === 1)
    unsubscribe()

    await seed('veh-b', { plate: 'bbb', created_at: ts('2026-02-01') })
    await new Promise(r => setTimeout(r, 500))

    expect(seen).toHaveLength(1)
  })
})
