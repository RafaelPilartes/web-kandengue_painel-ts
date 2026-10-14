// core/interfaces/IRideRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { RideDocEntity } from '../entities/Ride'
import type { ContactosPrivados } from '@/helpers/rideContacts'

export interface IRideRepository extends IBaseRepository<RideDocEntity> {
  /**
   * Os contactos de `rides/{id}/private/contacts`, ou `null` se o documento
   * não existir — o que é normal nas corridas anteriores à 3.2, que **não
   * migram** (§0A). Quem chama junta-o com a cópia embutida na corrida pelo
   * `contactosDaCorrida`.
   */
  getPrivateContacts(rideId: string): Promise<ContactosPrivados | null>
}
