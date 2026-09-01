import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import type { IReferralSettings } from '@/interfaces/IPromotion'

export class AppConfigUseCase extends BaseUseCase {
  protected readonly context = 'AppConfigUseCase'

  private get repository() {
    return ApiRepository.appConfig
  }

  executeGetReferralSettings(): Promise<IReferralSettings | null> {
    return this.run('getReferralSettings', () =>
      this.repository.getReferralSettings()
    )
  }

  executeUpdateReferralSettings(
    minimum: number,
    updatedBy: string
  ): Promise<void> {
    if (minimum < 0) {
      throw new Error('O mínimo não pode ser negativo')
    }
    return this.run('updateReferralSettings', () =>
      this.repository.updateReferralSettings(minimum, updatedBy)
    )
  }
}

export const appConfigUseCase = new AppConfigUseCase()
