// core/entities/Vehicle.ts
import type { FirestoreDataConverter } from 'firebase/firestore'
import type { VehicleDoc, VehicleInterface } from '@/interfaces/IVehicle'
import type { VehicleStatusEnumType, VehicleType } from '@/types/enum'
import { toDate } from '@/helpers/firestore'

export type VehicleEntityParams = Partial<
  Omit<VehicleInterface, 'id' | 'created_at' | 'updated_at' | 'reviewed_at'>
> & {
  id: string
  // As três datas aceitam `null` porque é o que o `toDate` do converter
  // devolve quando o campo não existe no documento. A `VehicleInterface`
  // declara-as como `Date`, e por isso saem do `Omit` e entram aqui.
  created_at?: Date | null
  updated_at?: Date | null
  reviewed_at?: Date | null
}

export class VehicleEntity implements VehicleInterface {
  id: string
  user_id: string
  type: VehicleType
  brand: string
  model: string
  color: string
  plate: string
  status: VehicleStatusEnumType
  /**
   * O que o admin escreveu ao recusar. Só existe em `rejected`: validar
   * apaga-o no servidor, para não ficar um motivo velho colado a uma
   * viatura aprovada.
   *
   * Declarado aqui e não só herdado: `implements` com campos opcionais não
   * obriga a classe a nada, e sem a declaração um `Partial<VehicleEntity>`
   * não conhecia o campo. Entra na `VehicleInterface` da lib na 2.8.0.
   */
  rejection_reason?: string
  reviewed_by?: string | null
  reviewed_at?: Date
  isDefault?: boolean
  image?: string
  created_at: Date
  updated_at?: Date

  constructor(params: VehicleEntityParams) {
    this.id = params.id
    this.user_id = params.user_id ?? ''
    this.type = params.type ?? 'car'
    this.brand = params.brand ?? ''
    this.model = params.model ?? ''
    this.color = params.color ?? ''
    this.plate = params.plate ?? ''
    this.status = params.status ?? 'under_analysis'
    this.rejection_reason = params.rejection_reason
    this.reviewed_by = params.reviewed_by
    this.reviewed_at = params.reviewed_at ?? undefined
    this.isDefault = params.isDefault
    this.image = params.image
    this.created_at = params.created_at ?? new Date()
    // Fronteira de ausência: o Firestore guarda `null`, a aplicação usa
    // `undefined` — um só valor de ausência, igual ao resto do codebase.
    this.updated_at = params.updated_at ?? undefined
  }
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const vehicleConverter: FirestoreDataConverter<VehicleEntity> = {
  toFirestore(vehicle) {
    return { ...vehicle }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as VehicleDoc
    return new VehicleEntity({
      ...d,
      id: snapshot.id,
      created_at: toDate(d.created_at),
      updated_at: toDate(d.updated_at),
      reviewed_at: toDate(d.reviewed_at)
    })
  }
}
