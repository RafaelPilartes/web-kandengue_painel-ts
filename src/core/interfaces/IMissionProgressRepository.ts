// core/interfaces/IMissionProgressRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { MissionProgressEntity } from '../entities/MissionProgress'

/**
 * **Só leitura.** O `updateProgress` que aqui estava saiu para a API
 * (`POST /api/v1/admin/drivers/:id/mission-progress/recalculate`).
 *
 * Os campos que decidem pagamento — `is_paid`, `type_paid`, `is_completed`,
 * `completed_at`, `completed_ride_ids` — passaram a ser só do servidor, e as
 * regras negam-nos ao cliente, admin incluído. Criar e apagar o documento
 * também: criar é escrevê-los, e apagar um `is_paid: true` deixava o mesmo
 * bónus pagável outra vez.
 *
 * `create`, `update` e `delete` do motor são excluídos do contrato de
 * propósito. A classe herda-os do `BaseFirebaseDAO`, mas quem a consome pela
 * fábrica vê este tipo e não lhes chega.
 */
export interface IMissionProgressRepository
  extends Omit<
    IBaseRepository<MissionProgressEntity>,
    'create' | 'update' | 'delete'
  > {
  getProgress(
    driverId: string,
    missionId: string
  ): Promise<MissionProgressEntity | null>
  getAllProgressByDriver(driverId: string): Promise<MissionProgressEntity[]>
}
