import type { Timestamp } from 'firebase/firestore'
import type { VehicleStatusEnumType, VehicleType } from '@/types/enum'

/**
 * O `VehicleInterface` vive agora em
 * `@rafaelpilartes/kandengue-shared/interfaces`.
 */
export type { VehicleInterface } from '@rafaelpilartes/kandengue-shared/interfaces'

/**
 * A forma CRUA do documento no Firestore — com `Timestamp` em vez de `Date`
 * e tudo opcional, porque um documento pode vir incompleto.
 *
 * Fica no painel e nao vai para a lib: o `Timestamp` e do SDK web do
 * Firebase, e as apps usam o SDK nativo, que tem outro. Um tipo que so
 * compila num dos lados nao pertence a uma biblioteca partilhada.
 */
export interface VehicleDoc {
  id?: string
  user_id?: string
  type?: VehicleType
  brand?: string
  model?: string
  color?: string
  plate?: string
  status?: VehicleStatusEnumType
  rejection_reason?: string
  reviewed_by?: string | null
  reviewed_at?: Timestamp | Date | null
  isDefault?: boolean
  image?: string
  created_at?: Timestamp | null
  updated_at?: Timestamp | null
}
