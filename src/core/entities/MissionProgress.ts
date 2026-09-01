import type { FirestoreDataConverter } from 'firebase/firestore'
import type { IMissionProgress } from '@/interfaces/IMissionProgress'
import { toDate } from '@/helpers/firestore'

/**
 * `id` é opcional em `IMissionProgress` (formulários que ainda não gravaram),
 * mas todo `MissionProgressEntity` que sai do DAO tem sempre `id` — é o que o
 * motor (`BaseFirebaseDAO<T extends { id: string }>`) exige.
 */
export type MissionProgressEntityParams = Omit<IMissionProgress, 'id'> & {
  id: string
}

export class MissionProgressEntity implements IMissionProgress {
  id: string
  driver_id: string
  mission_id: string
  current_count: number
  completed_ride_ids: string[]
  is_completed: boolean
  is_paid: boolean
  type_paid?: 'cash' | 'wallet'
  completed_at?: Date
  last_updated?: Date

  constructor(params: MissionProgressEntityParams) {
    this.id = params.id
    this.driver_id = params.driver_id
    this.mission_id = params.mission_id
    this.current_count = params.current_count
    this.completed_ride_ids = params.completed_ride_ids || []
    this.is_completed = params.is_completed
    this.is_paid = params.is_paid || false
    this.type_paid = params.type_paid
    this.completed_at = params.completed_at
    this.last_updated = params.last_updated
  }
}

/**
 * Fronteira única entre o documento `missionProgress` e a aplicação.
 *
 * Datas próprias desta entidade: `completed_at` e `last_updated` — a
 * segunda NÃO termina em `_at`, foge à convenção do resto do projecto. Um
 * converter escrito por hábito perde-a, e o `Timestamp` chegaria à
 * aplicação sem nada falhar até à execução.
 */
export const missionProgressConverter: FirestoreDataConverter<MissionProgressEntity> = {
  toFirestore(progress) {
    return { ...progress }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as Record<string, unknown>
    return new MissionProgressEntity({
      ...d,
      id: snapshot.id,
      completed_at: toDate(d.completed_at as never) ?? undefined,
      last_updated: toDate(d.last_updated as never) ?? undefined
    } as MissionProgressEntityParams)
  }
}
