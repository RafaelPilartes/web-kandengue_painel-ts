// core/interfaces/IWalletTopupRequestRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { WalletTopupRequestEntity } from '../entities/WalletTopupRequest'

export interface IWalletTopupRequestRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletTopupRequestEntity>
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>>
  getById(id: string): Promise<WalletTopupRequestEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>>
  getOneByField(
    field: string,
    value: any
  ): Promise<WalletTopupRequestEntity | null>
  create(
    WalletTopupRequest: Omit<WalletTopupRequestEntity, 'id'>
  ): Promise<WalletTopupRequestEntity>
  update(
    id: string,
    WalletTopupRequest: Partial<WalletTopupRequestEntity>
  ): Promise<WalletTopupRequestEntity>
  delete(id: string): Promise<void>
}
