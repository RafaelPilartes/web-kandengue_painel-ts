/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import type { FirestoreDataConverter } from 'firebase/firestore'
import type { IMission } from '@/interfaces/IMission'
import { toDate } from '@/helpers/firestore'
import { MissionEntity } from '@rafaelpilartes/kandengue-shared/entities'

export { MissionEntity }

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
