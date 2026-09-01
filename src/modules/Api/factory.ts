import type { IVehicleRepository } from '@/core/interfaces/IVehicleRepository'
import { FirebaseVehicleDAO } from './firebase/vehicle.dao'
import type { IMissionProgressRepository } from '@/core/interfaces/IMissionProgressRepository'
import { FirebaseMissionProgressDAO } from './firebase/missionProgress.dao'

/**
 * Getters lazy e memoizados. Vive fora de `index.ts` de propósito: aquele
 * módulo instancia ~20 DAOs no import, e importá-lo anularia a preguiça.
 * Cada DAO migrado acrescenta aqui o seu campo e desaparece de `index.ts`.
 */
class ApiFactory {
  private _vehicles?: IVehicleRepository
  private _missionProgress?: IMissionProgressRepository

  get vehicles(): IVehicleRepository {
    return (this._vehicles ??= new FirebaseVehicleDAO())
  }

  get missionProgress(): IMissionProgressRepository {
    return (this._missionProgress ??= new FirebaseMissionProgressDAO())
  }
}

export const ApiRepository = new ApiFactory()
