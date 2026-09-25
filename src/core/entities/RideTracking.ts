/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import { RideTrackingEntity } from '@rafaelpilartes/kandengue-shared/entities'
export { RideTrackingEntity }

import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { RideTrackingsInterface } from '@/interfaces/IRideTracking'
import type { LiveLocationType } from '@/types/ride'
import { toDate } from '@/helpers/firestore'

/** Forma crua de um ponto do trajeto — cada um tem o seu próprio timestamp. */
type LiveLocationDoc = Omit<LiveLocationType, 'timestamp'> & {
  timestamp?: Timestamp | Date | string | null
}

/**
 * Forma crua do documento em `rideTrackings`, tal como o Firestore o devolve.
 * Só o converter deve tocar neste tipo.
 */
interface RideTrackingDoc {
  id?: string
  ride_id?: string
  path?: LiveLocationDoc[]
  created_at?: Timestamp | Date | string | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const rideTrackingConverter: FirestoreDataConverter<RideTrackingEntity> =
  {
    toFirestore(rideTracking) {
      return { ...rideTracking }
    },
    fromFirestore(snapshot, options) {
      const d = snapshot.data(options) as RideTrackingDoc
      return new RideTrackingEntity({
        ...d,
        id: snapshot.id,
        // Cada ponto do path tem o seu próprio timestamp — convertido um a um.
        path: (d.path ?? []).map(point => ({
          ...point,
          timestamp: toDate(point.timestamp) ?? new Date(0)
        })),
        created_at: toDate(d.created_at) ?? undefined
      } as RideTrackingsInterface)
    }
  }
