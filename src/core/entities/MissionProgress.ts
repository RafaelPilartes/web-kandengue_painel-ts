/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import type { FirestoreDataConverter } from 'firebase/firestore'
import { toDate } from '@/helpers/firestore'
import { MissionProgressEntity, type MissionProgressEntityParams } from '@rafaelpilartes/kandengue-shared/entities'

export { MissionProgressEntity, type MissionProgressEntityParams }

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
