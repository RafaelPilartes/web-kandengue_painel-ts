import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { doc, setDoc, Timestamp } from 'firebase/firestore'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { testDb, assertEmulatorRunning, clearCollection } =
  await import('@/test/firebase.emulator')
const { vehicleUseCase } = await import('@/domain/usecases/vehicleUseCase')
const { AppError } = await import('@/domain/errors/AppError')

const COLLECTION = 'vehicles'
const ts = (iso: string) => Timestamp.fromDate(new Date(iso))

async function seed(id: string, data: Record<string, unknown>) {
  await setDoc(doc(testDb, `${COLLECTION}/${id}`), { id, ...data })
}

describe('vehicleUseCase', () => {
  beforeAll(async () => {
    await assertEmulatorRunning()
  })

  beforeEach(async () => {
    await clearCollection(COLLECTION)
  })

  it('executeGetAll delega no repositório', async () => {
    await seed('veh-a', { plate: 'aaa', created_at: ts('2026-01-01') })

    expect((await vehicleUseCase.executeGetAll()).data.map(v => v.id)).toEqual([
      'veh-a'
    ])
  })

  it('executeGetById devolve null quando não existe', async () => {
    expect(await vehicleUseCase.executeGetById('nao-existe')).toBeNull()
  })

  it('executeCreate rejeita matrícula vazia com AppError', async () => {
    await expect(
      vehicleUseCase.executeCreate({
        user_id: 'usr-1',
        type: 'car',
        brand: 'Toyota',
        model: 'Corolla',
        color: 'preto',
        plate: '   ',
        status: 'under_analysis'
      } as never)
    ).rejects.toBeInstanceOf(AppError)
  })

  it('executeCreate normaliza a matrícula para minúsculas', async () => {
    const created = await vehicleUseCase.executeCreate({
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'LD-11-11-AA',
      status: 'under_analysis'
    } as never)

    expect(created.plate).toBe('ld-11-11-aa')
  })

  it('os erros saem sempre como AppError com contexto', async () => {
    await expect(
      vehicleUseCase.executeUpdate('nao-existe', { status: 'validated' })
    ).rejects.toBeInstanceOf(AppError)
  })
})
