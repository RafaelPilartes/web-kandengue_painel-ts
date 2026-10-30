// modules/Api/firebase/ride.dao.ts
import type { IRideRepository } from '@/core/interfaces/IRideRepository'
import type { RideDocEntity } from '@/core/entities/Ride'
import { rideConverter } from '@/core/entities/Ride'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'
import { doc, getDoc } from 'firebase/firestore'
import { RIDE_PRIVATE_DOCS } from '@rafaelpilartes/kandengue-shared/interfaces'
import { db } from '@/config/firebase.config'
import type { PrivateContacts } from '@/helpers/rideContacts'

export class FirebaseRideDAO
  extends BaseFirebaseDAO<RideDocEntity>
  implements IRideRepository
{
  /**
   * A ride's contacts, from `rides/{id}/private/contacts`.
   *
   * ── Why a method of its own, and not a field of the ride ──
   * It is **another document**, in a subcollection that does not inherit the
   * parent's rules (what 3.2 taught, and what §0AB fixed): the admin reads it,
   * the owning passenger reads it, the assigned driver reads only this one —
   * never the codes. It is read apart because it is authorised apart.
   *
   * ⚠️ **Returns `null` when it does not exist, and that is a normal case**:
   * rides older than 3.2 have no document and **are not migrated** (§0A). The
   * caller merges it with the embedded copy via `rideContacts`.
   *
   * No converter: it is four strings, and a converter for them would be
   * ceremony without content.
   */
  async getPrivateContacts(rideId: string): Promise<PrivateContacts | null> {
    const snap = await getDoc(
      // The name comes from the lib now (3.0.0 installed): `RIDE_PRIVATE_DOCS`
      // is the same constant the API and the functions use, so the three ends
      // cannot drift on a document name.
      doc(db, this.path, rideId, 'private', RIDE_PRIVATE_DOCS.contacts)
    )
    return snap.exists() ? (snap.data() as PrivateContacts) : null
  }

  constructor() {
    // `RideEntity` não tem campo de texto de topo útil para um admin
    // procurar uma corrida — os únicos são `status`, `type` e `cancel_reason`.
    // (O `otp_code` estava nesta lista e saiu do documento da corrida com a
    // API 2.0.0; nunca foi o campo de pesquisa, mas era um candidato citado.)
    // `driver.email` é aninhado (ver `SearchField<T>` em `BaseFirebaseDAO`) e
    // é por onde o admin procura: pelo motorista.
    super(firebaseCollections.rides.root, rideConverter, 'rid', 'driver.email')
  }
}
