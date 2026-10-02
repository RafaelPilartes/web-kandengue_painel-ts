import ApiDAO from './Api.dao'
import type {
  AdminConfigSaveResult,
  AppVersionsPayload,
  IAdminConfigRepository,
  WalletTopupConfigPayload
} from '@/core/interfaces/IAdminConfigRepository'

export class AdminConfigDAO implements IAdminConfigRepository {
  async saveAppVersions(
    payload: AppVersionsPayload
  ): Promise<AdminConfigSaveResult> {
    return ApiDAO.put('/api/v1/admin/config/app-versions', payload)
  }

  async saveWalletTopupConfig(
    payload: WalletTopupConfigPayload
  ): Promise<AdminConfigSaveResult> {
    // Os opcionais só vão quando têm conteúdo: o schema da API apara e
    // recusa strings vazias com `min(1)` nos obrigatórios.
    return ApiDAO.put('/api/v1/admin/config/wallet-topup', {
      iban: payload.iban,
      account_holder: payload.account_holder,
      min_amount: payload.min_amount,
      ...(payload.holder_note?.trim()
        ? { holder_note: payload.holder_note.trim() }
        : {}),
      ...(payload.transfer_reference_hint?.trim()
        ? { transfer_reference_hint: payload.transfer_reference_hint.trim() }
        : {})
    })
  }
}
