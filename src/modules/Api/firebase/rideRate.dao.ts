// modules/Api/firebase/rideRate.dao.ts
import type { IRideRateRepository } from '@/core/interfaces/IRideRateRepository'
import { RideRateEntity, rideRateConverter } from '@/core/entities/RideRate'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseRideRateDAO
  extends BaseFirebaseDAO<RideRateEntity>
  implements IRideRateRepository
{
  constructor() {
    // Sem searchField: a entidade não tem um único campo de texto de topo
    // (`day_rates` e `payouts` são objectos). O antigo pesquisava por
    // `email`, que não existe — o motor agora lança em vez de mentir.
    super(firebaseCollections.rideRates.root, rideRateConverter, 'rate')
  }
}
