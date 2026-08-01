// modules/Api/firebase/vehicle.dao.ts
import type { IVehicleRepository } from '@/core/interfaces/IVehicleRepository'
import { VehicleEntity, vehicleConverter } from '@/core/entities/Vehicle'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { BaseFirebaseDAO } from './BaseFirebaseDAO'

export class FirebaseVehicleDAO
  extends BaseFirebaseDAO<VehicleEntity>
  implements IVehicleRepository
{
  constructor() {
    // O 4º argumento é o campo de prefix-search. `plate` só funciona se as
    // matrículas estiverem gravadas em minúsculas — ver o teste de pesquisa.
    super(firebaseCollections.vehicles.root, vehicleConverter, 'veh', 'plate')
  }
}
