import { describe, it, expect, vi } from 'vitest'

vi.mock('@/config/firebase.config', async () => {
  const { testDb } = await import('@/test/firebase.emulator')
  return { db: testDb, auth: {}, storage: {} }
})

const { ApiRepository } = await import('@/modules/Api/factory')
const { FirebaseVehicleDAO } =
  await import('@/modules/Api/firebase/vehicle.dao')

describe('ApiFactory', () => {
  it('devolve a implementação Firebase de vehicles', () => {
    expect(ApiRepository.vehicles).toBeInstanceOf(FirebaseVehicleDAO)
  })

  it('memoiza: dois acessos devolvem a mesma instância', () => {
    expect(ApiRepository.vehicles).toBe(ApiRepository.vehicles)
  })
})
