import type { IVehicleRepository } from '@/core/interfaces/IVehicleRepository'
import { FirebaseVehicleDAO } from './firebase/vehicle.dao'

/**
 * Getters lazy e memoizados. Vive fora de `index.ts` de propósito: aquele
 * módulo instancia ~20 DAOs no import, e importá-lo anularia a preguiça.
 * Cada DAO migrado acrescenta aqui o seu campo e desaparece de `index.ts`.
 */
class ApiFactory {
  private _vehicles?: IVehicleRepository

  get vehicles(): IVehicleRepository {
    return (this._vehicles ??= new FirebaseVehicleDAO())
  }
}

export const ApiRepository = new ApiFactory()
