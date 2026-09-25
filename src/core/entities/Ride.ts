// core/entities/Ride.ts
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { DriverInterface } from '@/interfaces/IDriver'
import type { RideInterface } from '@/interfaces/IRide'
import type { RideFareInterface } from '@/interfaces/IRideFare'
import type { UserInterface } from '@/interfaces/IUser'
import type { RideStatusType, RideType } from '@/types/enum'
import type { GeoLocationType } from '@/types/geoLocation'
import type { RideDetailsType } from '@/types/ride'
import { toDate } from '@/helpers/firestore'

/**
 * `id` sempre presente — ver o comentario equivalente em `UserEntityParams`.
 * O `fromFirestore` passa `snapshot.id`, que e sempre uma string.
 */
export type RideEntityParams = Omit<RideInterface, 'id'> & { id: string }

export class RideEntity implements RideInterface {
  id: string
  user: UserInterface
  driver?: DriverInterface
  pickup: GeoLocationType
  dropoff: GeoLocationType
  status: RideStatusType

  distance: number
  duration: number

  fare: RideFareInterface

  type: RideType
  otp_code?: string
  cancel_reason?: string
  details?: RideDetailsType

  proof_pickup_photo?: string
  proof_dropoff_photo?: string
  waiting_start_at?: Date
  waiting_end_at?: Date

  completed_at?: Date
  canceled_at?: Date

  created_at?: Date
  updated_at?: Date

  constructor(params: RideEntityParams) {
    this.id = params.id
    this.user = params.user
    this.driver = params.driver
    this.pickup = params.pickup
    this.dropoff = params.dropoff
    this.status = params.status

    this.fare = params.fare

    this.distance = params.distance
    this.duration = params.duration

    this.type = params.type
    this.otp_code = params.otp_code
    this.cancel_reason = params.cancel_reason
    this.details = params.details

    this.proof_pickup_photo = params.proof_pickup_photo
    this.proof_dropoff_photo = params.proof_dropoff_photo
    this.waiting_start_at = params.waiting_start_at
    this.waiting_end_at = params.waiting_end_at

    this.completed_at = params.completed_at
    this.canceled_at = params.canceled_at

    this.created_at = params.created_at
    this.updated_at = params.updated_at
  }
}

/**
 * `RideInterface.id` é opcional — partilhado com outras partes do ecossistema
 * em `IRide.ts`, e usado em código existente (ViewModels/páginas) para
 * corridas ainda não persistidas. Mas o `BaseFirebaseDAO` exige `id: string`
 * no seu genérico, e uma corrida vinda do Firestore tem sempre um `id` (o do
 * próprio documento). Este tipo documenta essa garantia só na fronteira do
 * DAO, sem apertar `RideEntity.id` para o resto da aplicação.
 */
export type RideDocEntity = RideEntity & { id: string }

/**
 * Forma crua do documento em `rides`, tal como o Firestore o devolve.
 * Difere de `RideInterface` nas seis datas: aqui são `Timestamp`. `fare`
 * (breakdown + payouts) e as localizações não têm datas — confirmado nas
 * respectivas interfaces. Só o converter deve tocar neste tipo.
 */
interface RideDoc
  extends Omit<
    RideInterface,
    | 'waiting_start_at'
    | 'waiting_end_at'
    | 'completed_at'
    | 'canceled_at'
    | 'created_at'
    | 'updated_at'
  > {
  waiting_start_at?: Timestamp | Date | string | null
  waiting_end_at?: Timestamp | Date | string | null
  completed_at?: Timestamp | Date | string | null
  canceled_at?: Timestamp | Date | string | null
  created_at?: Timestamp | Date | string | null
  updated_at?: Timestamp | Date | string | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const rideConverter: FirestoreDataConverter<RideDocEntity> = {
  toFirestore(ride) {
    return { ...ride }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as RideDoc
    // `id: snapshot.id` é sempre uma string — daí o cast para `RideDocEntity`.
    return new RideEntity({
      ...d,
      id: snapshot.id,
      waiting_start_at: toDate(d.waiting_start_at) ?? undefined,
      waiting_end_at: toDate(d.waiting_end_at) ?? undefined,
      completed_at: toDate(d.completed_at) ?? undefined,
      canceled_at: toDate(d.canceled_at) ?? undefined,
      created_at: toDate(d.created_at) ?? undefined,
      updated_at: toDate(d.updated_at) ?? undefined
    } as RideInterface) as RideDocEntity
  }
}
