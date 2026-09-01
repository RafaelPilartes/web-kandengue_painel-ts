// modules/Api/firebase/ride.dao.ts
import type { IRideRepository } from '@/core/interfaces/IRideRepository'
import type { RideDocEntity } from '@/core/entities/Ride'
import { rideConverter } from '@/core/entities/Ride'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseRideDAO
  extends BaseFirebaseDAO<RideDocEntity>
  implements IRideRepository
{
  constructor() {
    // `RideEntity` não tem campo de texto de topo útil para um admin
    // procurar uma corrida — os únicos são `status`, `type`, `otp_code` e
    // `cancel_reason`. `driver.email` é aninhado (ver `SearchField<T>` em
    // `BaseFirebaseDAO`) e é por onde o admin procura: pelo motorista.
    super(firebaseCollections.rides.root, rideConverter, 'rid', 'driver.email')
  }
}
