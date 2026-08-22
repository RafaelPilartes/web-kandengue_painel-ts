// core/interfaces/IWalletRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { WalletEntity } from '../entities/Wallet'

export interface IWalletRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity[]>>
  getById(id: string): Promise<WalletEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletEntity[]>>
  getOneByField(field: string, value: any): Promise<WalletEntity | null>
  // Sem `create`, `update` nem `delete`: essas operações vivem na API, em
  // transacções auditadas. Ver `IAdminMoneyRepository`.
}
