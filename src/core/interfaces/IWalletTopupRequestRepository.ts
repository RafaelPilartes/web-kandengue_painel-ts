// core/interfaces/IWalletTopupRequestRepository.ts
import type { IBaseRepository } from './IBaseRepository'
import type { WalletTopupRequestEntity } from '../entities/WalletTopupRequest'

export interface IWalletTopupRequestRepository
  extends IBaseRepository<WalletTopupRequestEntity> {}
