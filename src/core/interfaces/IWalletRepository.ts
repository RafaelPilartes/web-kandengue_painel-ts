import type { ListResponseType } from '@/interfaces/IApiResponse'
import { WalletEntity } from '../entities/Wallet'

export interface IWalletRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletEntity[]>>
  getById(id: string): Promise<ListResponseType<WalletEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletEntity[]>>
  create(
    Wallet: Omit<WalletEntity, 'id'>
  ): Promise<ListResponseType<WalletEntity>>
  update(
    id: string,
    Wallet: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity>>
  delete(id: string): Promise<void>
}
