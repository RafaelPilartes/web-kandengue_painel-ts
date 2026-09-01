// modules/Api/firebase/rideTracking.dao.ts
import type { IRideTrackingRepository } from '@/core/interfaces/IRideTrackingRepository'
import {
  RideTrackingEntity,
  rideTrackingConverter
} from '@/core/entities/RideTracking'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseRideTrackingDAO
  extends BaseFirebaseDAO<RideTrackingEntity>
  implements IRideTrackingRepository
{
  constructor() {
    // `ride_id` já era o campo certo — o antigo DAO já pesquisava por ele.
    super(
      firebaseCollections.rideTrackings.root,
      rideTrackingConverter,
      'rtck',
      'ride_id'
    )
  }
}
