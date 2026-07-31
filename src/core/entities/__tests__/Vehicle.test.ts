import { describe, it, expect } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import type { QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'
import { VehicleEntity, vehicleConverter } from '@/core/entities/Vehicle'

/** Snapshot mínimo — só o que o converter usa. */
function snapshotOf(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: (_options?: SnapshotOptions) => data
  } as unknown as QueryDocumentSnapshot
}

describe('vehicleConverter.fromFirestore', () => {
  it('converte Timestamp em Date', () => {
    const created = new Date('2026-01-15T10:00:00.000Z')

    const entity = vehicleConverter.fromFirestore(
      snapshotOf('veh-1', {
        id: 'veh-1',
        user_id: 'usr-1',
        type: 'car',
        brand: 'Toyota',
        model: 'Corolla',
        color: 'preto',
        plate: 'LD-11-11-AA',
        status: 'validated',
        created_at: Timestamp.fromDate(created),
        updated_at: null
      }),
      {}
    )

    expect(entity).toBeInstanceOf(VehicleEntity)
    expect(entity.created_at).toBeInstanceOf(Date)
    expect(entity.created_at).toEqual(created)
    expect(entity.updated_at).toBeUndefined()
  })

  it('usa o id do snapshot mesmo que o campo id falte no documento', () => {
    const entity = vehicleConverter.fromFirestore(
      snapshotOf('veh-2', { plate: 'LD-22-22-BB' }),
      {}
    )

    expect(entity.id).toBe('veh-2')
  })

  it('aplica defaults a campos em falta', () => {
    const entity = vehicleConverter.fromFirestore(
      snapshotOf('veh-3', { plate: 'LD-33-33-CC' }),
      {}
    )

    expect(entity.status).toBe('under_analysis')
    expect(entity.created_at).toBeInstanceOf(Date)
  })
})

describe('vehicleConverter.toFirestore', () => {
  it('não escreve o campo id dentro do documento duas vezes nem perde campos', () => {
    const entity = new VehicleEntity({
      id: 'veh-1',
      user_id: 'usr-1',
      type: 'car',
      brand: 'Toyota',
      model: 'Corolla',
      color: 'preto',
      plate: 'LD-11-11-AA',
      status: 'validated'
    })

    const raw = vehicleConverter.toFirestore(entity) as Record<string, unknown>

    expect(raw.plate).toBe('LD-11-11-AA')
    expect(raw.id).toBe('veh-1')
  })
})
