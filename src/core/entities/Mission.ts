import type { FirestoreDataConverter } from 'firebase/firestore'
import type { IMission } from '@/interfaces/IMission'
import type { MissionType } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

export class MissionEntity implements IMission {
  id: string
  type: MissionType
  target: number
  reward: number
  is_active: boolean
  created_at: Date
  updated_at?: Date

  constructor(params: IMission) {
    this.id = params.id
    this.type = params.type
    this.target = params.target
    this.reward = params.reward
    this.is_active = params.is_active
    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}

/** Fronteira única entre o documento `missions` e a aplicação. */
export const missionConverter: FirestoreDataConverter<MissionEntity> = {
  toFirestore(mission) {
    return { ...mission }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as Record<string, unknown>
    return new MissionEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at as never) ?? new Date(),
      updated_at: toDate(d.updated_at as never) ?? undefined
    } as IMission)
  }
}
