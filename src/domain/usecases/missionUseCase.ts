import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { MissionEntity } from '@/core/entities/Mission'
import type { RecalculateResult } from '@/core/interfaces/IAdminMissionRepository'

export class MissionUseCase extends BaseUseCase {
  protected readonly context = 'MissionUseCase'

  private get repository() {
    return ApiRepository.missions
  }

  // O DAO de progresso vive à parte (colecção `missionProgress`), e é **só
  // de leitura**: os campos que decidem pagamento são do servidor.
  private get progressRepository() {
    return ApiRepository.missionProgress
  }

  executeGetAllMissions() {
    return this.run('getAllMissions', () => this.repository.getAll())
  }

  executeGetActiveMissions() {
    return this.run('getActiveMissions', () =>
      this.repository.getAll({
        limit: 100,
        filters: { is_active: true }
      })
    )
  }

  executeGetById(id: string) {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeCreateMission(mission: Omit<MissionEntity, 'id'>) {
    return this.run('createMission', () => this.repository.create(mission))
  }

  executeUpdateMission(id: string, mission: Partial<MissionEntity>) {
    return this.run('updateMission', () =>
      this.repository.update(id, mission)
    )
  }

  executeDeleteMission(id: string) {
    return this.run('deleteMission', () => this.repository.delete(id))
  }

  /**
   * Lê o progresso do motorista. **Não** recalcula quando está vazio.
   *
   * Recalculava: um `getDriverProgress` sem resultados chamava o recálculo e
   * voltava a ler. Era uma escrita escondida dentro de uma leitura — abrir o
   * ecrã de um motorista escrevia em `missionProgress` — e agora essa escrita
   * é do servidor. Vazio é vazio: o trigger `onRideUpdated` cria o progresso
   * quando a primeira corrida do ciclo fecha, e o botão "Recalcular
   * progresso" força-o quando é preciso.
   */
  executeGetDriverProgress(driver_id: string) {
    return this.run('getDriverProgress', () =>
      this.progressRepository.getAllProgressByDriver(driver_id)
    )
  }

  /*
   * As duas acções que vão pela API **não** passam pelo `run()`, como as
   * outras acções de admin: o `toAppError` substituiria a mensagem da API por
   * uma genérica, e o admin deixava de saber o que falhou.
   */

  /**
   * Recalcula no servidor, do zero, com auditoria. Era um recálculo no
   * browser que escrevia o documento inteiro — `is_paid` incluído.
   */
  executeRecalculateDriverProgress(
    driver_id: string
  ): Promise<RecalculateResult> {
    return ApiRepository.adminMissions.recalculateProgress(driver_id)
  }

  /**
   * Paga o bónus numa única chamada ao servidor. `paid: false` significa que
   * a missão já estava paga — não é erro.
   *
   * O valor pago é o `reward_snapshot` do progresso, fixado quando a missão
   * fechou: corrigir o prémio da campanha depois já não muda o que se deve a
   * quem a cumpriu.
   */
  executePayMissionProgress(
    driverId: string,
    missionId: string,
    typePaid: 'cash' | 'wallet'
  ): Promise<{ paid: boolean; balance: number | null }> {
    return ApiRepository.adminMoney.payMissionBonus({
      driver_id: driverId,
      mission_id: missionId,
      type_paid: typePaid
    })
  }
}

export const missionUseCase = new MissionUseCase()
