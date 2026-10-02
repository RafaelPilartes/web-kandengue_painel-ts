/**
 * Escrita dos documentos de `app_config`. Corre no servidor e fica em
 * `auditLogs` com o antes e o depois de cada campo que mudou.
 *
 * Os dois saíram do alcance do cliente nas regras: o `app_versions` porque
 * `min_version_*` bloqueia toda a base instalada abaixo dele, o
 * `wallet_topup` porque é um IBAN.
 */
export interface AdminConfigSaveResult {
  /** `false` quando o pedido não muda nada — não é erro, e não audita. */
  changed: boolean
  changed_fields: string[]
}

export interface AppVersionsPayload {
  min_version_driver_android: string
  min_version_driver_ios: string
  latest_version_driver_android: string
  latest_version_driver_ios: string
  min_version_passenger_android: string
  min_version_passenger_ios: string
  latest_version_passenger_android: string
  latest_version_passenger_ios: string
}

export interface WalletTopupConfigPayload {
  iban: string
  account_holder: string
  holder_note?: string
  transfer_reference_hint?: string
  min_amount: number
}

export interface IAdminConfigRepository {
  /**
   * A API recusa um mínimo acima da versão mais recente da mesma app e
   * plataforma: é um mínimo que ninguém consegue alcançar.
   */
  saveAppVersions(payload: AppVersionsPayload): Promise<AdminConfigSaveResult>

  saveWalletTopupConfig(
    payload: WalletTopupConfigPayload
  ): Promise<AdminConfigSaveResult>
}
