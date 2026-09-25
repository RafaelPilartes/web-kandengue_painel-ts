/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import type { FirestoreDataConverter } from 'firebase/firestore'
import type { UserDoc } from './User'
import type { VehicleInterface } from '@/interfaces/IVehicle'
import type { LocationType } from '@/types/geoLocation'
import { toDate } from '@/helpers/firestore'
import { DriverEntity, type DriverEntityParams } from '@rafaelpilartes/kandengue-shared/entities'

export { DriverEntity, type DriverEntityParams }

/**
 * Forma CRUA do documento em `drivers`. As datas (`created_at`, `updated_at`,
 * `last_login`) vêm de `UserEntity` — `DriverEntity` não declara nenhuma
 * data própria, mas o converter tem de as converter na mesma.
 */
export interface DriverDoc extends Omit<UserDoc, 'id'> {
  id?: string
  is_online?: boolean
  vehicle?: VehicleInterface
  rating?: number
  /*
   * `LocationType`, nao `GeoLocationType`.
   *
   * O painel declarava-o como `GeoLocationType` — um sitio com morada e
   * `place_id`. Mas a posicao actual de um motorista e uma leitura do GPS:
   * coordenadas, rumo, velocidade. E o que as apps escrevem, e o que o
   * painel de facto le (so `latitude` e `longitude`, em Rides/realtime).
   */
  current_location?: LocationType
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const driverConverter: FirestoreDataConverter<DriverEntity> = {
  toFirestore(driver) {
    return { ...driver }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as DriverDoc
    return new DriverEntity({
      ...d,
      id: snapshot.id,
      is_online: d.is_online ?? false,
      // Datas herdadas de `UserEntity` — a armadilha desta task.
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined,
      last_login: toDate(d.last_login) ?? undefined
    } as DriverEntityParams)
  }
}
