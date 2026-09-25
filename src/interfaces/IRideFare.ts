/**
 * Vive agora na lib partilhada.
 *
 * ── Dois subpaths, e porque ──
 * O `RideFareInterface` e uma entidade do dominio e vem de `/domain`. O
 * `BreakdownType` e o `PayoutsBreakdownType` sao tipos de apoio — a
 * decomposicao do dinheiro de uma corrida — e vem de `/ride`, com o resto
 * do que descreve uma corrida.
 *
 * ── Uma renomeacao ──
 * O que aqui se chamava `PayoutsType` (valores) passa a
 * `PayoutsBreakdownType`. O nome antigo colidia com o `PayoutsType` de
 * `types/ride.ts`, que sao PERCENTAGENS.
 */
export type { RideFareInterface } from '@rafaelpilartes/kandengue-shared/domain'
export type {
  BreakdownType,
  PayoutsBreakdownType
} from '@rafaelpilartes/kandengue-shared/ride'
