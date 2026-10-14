// core/interfaces/IRideRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { RideDocEntity } from '../entities/Ride'
import type { PrivateContacts } from '@/helpers/rideContacts'

export interface IRideRepository extends IBaseRepository<RideDocEntity> {
  /**
   * The contacts from `rides/{id}/private/contacts`, or `null` if the document
   * does not exist — normal for rides older than 3.2, which **are not
   * migrated** (§0A). The caller merges it with the copy embedded in the ride
   * via `rideContacts`.
   */
  getPrivateContacts(rideId: string): Promise<PrivateContacts | null>
}
