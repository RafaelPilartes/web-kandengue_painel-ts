/**
 * Vive agora em `@rafaelpilartes/kandengue-shared/domain`.
 *
 * ── Uma renomeacao ──
 * O que aqui se chamava `PayoutsType` (valores: driver_earnings,
 * company_earnings, pension_fund) passa a `PayoutsBreakdownType`. O nome
 * antigo colidia com o `PayoutsType` de `types/ride.ts`, que sao
 * PERCENTAGENS — dois conceitos diferentes com o mesmo nome no mesmo
 * ecossistema.
 */
export type {
  BreakdownType,
  PayoutsBreakdownType,
  RideFareInterface
} from '@rafaelpilartes/kandengue-shared/domain'
