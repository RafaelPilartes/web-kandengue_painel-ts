// core/interfaces/IRideRateRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { RideRateEntity } from '../entities/RideRate'

/**
 * **Só leitura.** `rideRates` é legado e passou a `allow write: if false` nas
 * regras: quem fixa preços desde o motor de preços é `pricingProfiles`, em
 * Preços → Perfis, escrito pela API.
 *
 * `create`, `update` e `delete` do motor são excluídos do contrato de
 * propósito. A classe herda-os do `BaseFirebaseDAO`, mas quem a consome pela
 * fábrica vê este tipo e não lhes chega.
 */
export interface IRideRateRepository
  extends Omit<
    IBaseRepository<RideRateEntity>,
    'create' | 'update' | 'delete'
  > {}
