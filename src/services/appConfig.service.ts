// services/appConfig.service.ts
import type { IReferralSettings } from '@/interfaces/IPromotion'
import { appConfigRepository } from '@/modules/Api'

export class AppConfigService {
  async getReferralSettings(): Promise<IReferralSettings | null> {
    try {
      return await appConfigRepository.getReferralSettings()
    } catch (error: any) {
      console.error('Erro ao ler referral_settings:', error)
      throw new Error(error.message || 'Erro ao ler referral_settings')
    }
  }

  async updateReferralSettings(
    minimum: number,
    updatedBy: string
  ): Promise<void> {
    if (minimum < 0) {
      throw new Error('O mínimo não pode ser negativo')
    }
    try {
      return await appConfigRepository.updateReferralSettings(
        minimum,
        updatedBy
      )
    } catch (error: any) {
      console.error('Erro ao atualizar referral_settings:', error)
      throw new Error(error.message || 'Erro ao atualizar referral_settings')
    }
  }
}
