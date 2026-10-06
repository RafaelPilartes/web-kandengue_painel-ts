/**
 * Recálculo do progresso das missões. Corre no servidor e fica em
 * `auditLogs` com o antes de cada progresso alterado.
 *
 * Os campos que decidem pagamento — `is_paid`, `type_paid`, `is_completed`,
 * `completed_at`, `completed_ride_ids` — saíram do alcance do cliente nas
 * regras, admin incluído: são eles que dizem **se** e **quanto** de bónus se
 * paga, e o painel recalculava-os no browser.
 */
export interface RecalculateDetail {
  mission_id: string
  current_count: number
  target: number
  is_completed: boolean
  changed: boolean
}

export interface RecalculateResult {
  driver_id: string
  /** Missões activas consideradas. */
  missions: number
  /** Progressos escritos — os que não mudaram não contam. */
  changed: number
  details: RecalculateDetail[]
  /**
   * `true` quando a leitura das corridas bateu no limite de 1000: a contagem
   * pode estar abaixo da real, e o ecrã deve dizê-lo.
   */
  truncated: boolean
}

export interface IAdminMissionRepository {
  /**
   * Recalcula **do zero** a partir das corridas concluídas no ciclo — não
   * incrementa. É o que torna inofensiva a duplicação com o trigger
   * `onRideUpdated`: correr os dois dá o mesmo resultado.
   */
  recalculateProgress(driverId: string): Promise<RecalculateResult>
}
