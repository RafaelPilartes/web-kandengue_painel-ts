import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

// Redirecciona o `db` da app para o emulador. Tem de vir antes do import do DAO.
vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { FirebaseVehicleDAO } =
  await import('@/modules/Api/firebase/vehicle.dao')

const COLLECTION = 'vehicles'

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('FirebaseVehicleDAO (legado) — caracterização', () => {
  let dao: InstanceType<typeof FirebaseVehicleDAO>

  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
    dao = new FirebaseVehicleDAO()
  })

  it('getAll devolve os veículos ordenados por created_at desc', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      brand: 'Toyota',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })
    await seed('veh-b', {
      plate: 'LD-22-22-BB',
      brand: 'Honda',
      created_at: Timestamp.fromDate(new Date('2026-06-01'))
    })

    const res = await dao.getAll(10)

    expect(res.data.map(v => v.id)).toEqual(['veh-b', 'veh-a'])
  })

  it('getById devolve null quando o documento não existe', async () => {
    expect(await dao.getById('nao-existe')).toBeNull()
  })

  it('getOneByField encontra por matrícula exacta', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const found = await dao.getOneByField('plate', 'LD-11-11-AA')

    expect(found?.id).toBe('veh-a')
  })

  it('create grava o documento e devolve a entidade', async () => {
    const created = await dao.create({
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'LD-33-33-CC',
      status: 'under_analysis'
    } as never)

    expect(created.id).toMatch(/^veh-/)
    const stored = await dao.getById(created.id)
    expect(stored?.plate).toBe('LD-33-33-CC')
  })

  it('update altera o campo e devolve a entidade actualizada', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      status: 'under_analysis',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const updated = await dao.update('veh-a', { status: 'validated' })

    expect(updated.status).toBe('validated')
  })

  it('delete remove o documento', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    await dao.delete('veh-a')

    expect(await dao.getById('veh-a')).toBeNull()
  })

  // ─────────── Bugs actuais, documentados de propósito ───────────
  // Estes dois testes asseveram o comportamento ERRADO de hoje.
  // A Task 9 vai invertê-los — é esse o sinal de que a migração corrigiu algo.

  it('BUG: created_at volta como Timestamp, não como Date', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    const found = await dao.getById('veh-a')

    // VehicleEntity declara `created_at?: Date`, mas o que chega é um Timestamp.
    // Qualquer `.toLocaleDateString()` na UI rebenta em runtime.
    expect(found?.created_at).toBeInstanceOf(Timestamp)
    expect(found?.created_at).not.toBeInstanceOf(Date)
  })

  it('BUG: a pesquisa por matrícula não encontra nada (case mismatch)', async () => {
    await seed('veh-a', {
      plate: 'LD-11-11-AA',
      created_at: Timestamp.fromDate(new Date('2026-01-01'))
    })

    // O DAO faz `searchTerm.toLowerCase()` mas as matrículas estão gravadas
    // em maiúsculas — o range nunca encontra nada.
    const res = await dao.getAll(10, 0, 'LD-11')

    expect(res.data).toHaveLength(0)
  })
})
