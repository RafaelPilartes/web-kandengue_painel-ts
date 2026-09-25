/*
 * As classes vivem agora em `@rafaelpilartes/kandengue-shared/entities`.
 *
 * Fica aqui o que nao e partilhavel: o converter, que depende do SDK do
 * Firestore deste repositorio.
 */
import type { FirestoreDataConverter, Timestamp } from 'firebase/firestore'
import type { RideRatesInterface } from '@/interfaces/IRideRates'
import type { RateType, PayoutsType } from '@/types/ride'
import { toDate } from '@/helpers/firestore'
import { RideRateEntity } from '@rafaelpilartes/kandengue-shared/entities'

export { RideRateEntity }

/**
 * Forma CRUA do documento em `rideRates`, tal como o Firestore o devolve.
 * Difere de `RideRatesInterface` nas datas: aqui são `Timestamp`.
 *
 * NOTA: os documentos reais também trazem `created_at` (usado só para a
 * ordenação por omissão do motor) e outros campos que a entidade não
 * modela — divergência entre entidade e Firestore, registada no relatório
 * do lote, não corrigida aqui por iniciativa própria.
 */
export interface RideRateDoc {
  id?: string
  day_rates?: RateType
  night_rates?: RateType
  insurance_percent?: number
  payouts?: PayoutsType
  updated_at?: Timestamp | null
}

/** Fronteira única entre o documento Firestore e a aplicação. */
export const rideRateConverter: FirestoreDataConverter<RideRateEntity> = {
  toFirestore(rideRate) {
    return { ...rideRate }
  },
  fromFirestore(snapshot, options) {
    const d = snapshot.data(options) as RideRateDoc
    return new RideRateEntity({
      ...d,
      id: snapshot.id,
      updated_at: toDate(d.updated_at) ?? undefined
    } as RideRatesInterface)
  }
}
