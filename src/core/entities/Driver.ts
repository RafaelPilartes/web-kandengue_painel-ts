import type { FirestoreDataConverter } from 'firebase/firestore'
import { UserEntity } from './User'
import type { UserDoc } from './User'
import type { DriverInterface } from '@/interfaces/IDriver'
import type { VehicleInterface } from '@/interfaces/IVehicle'
import type { GeoLocationType } from '@/types/geoLocation'
import { toDate } from '@/helpers/firestore'

/** `id` sempre presente — ver o comentário equivalente em `UserEntityParams`. */
export type DriverEntityParams = Omit<DriverInterface, 'id'> & { id: string }

export class DriverEntity extends UserEntity implements DriverInterface {
  is_online: boolean
  vehicle?: VehicleInterface
  rating?: number
  current_location?: GeoLocationType

  constructor(params: DriverEntityParams) {
    super(params)
    this.is_online = params.is_online
    this.vehicle = params.vehicle
    this.rating = params.rating
    this.current_location = params.current_location
  }
}

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
  current_location?: GeoLocationType
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
