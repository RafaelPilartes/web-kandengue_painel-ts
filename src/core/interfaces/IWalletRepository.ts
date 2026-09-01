// core/interfaces/IWalletRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { QueryOptions } from './IBaseRepository'
import { WalletEntity } from '../entities/Wallet'

/**
 * Não estende `IBaseRepository`: isso traria `create`, `update` e `delete`
 * de volta ao tipo — mesmo que a implementação os recusasse em runtime — e é
 * exactamente essa porta que este ficheiro existe para manter fechada.
 */
export interface IWalletRepository {
  getAll(
    options?: QueryOptions<WalletEntity>
  ): Promise<ListResponseType<WalletEntity[]>>
  getById(id: string): Promise<WalletEntity | null>
  getAllByField(
    field: keyof WalletEntity,
    value: unknown,
    options?: Omit<QueryOptions<WalletEntity>, 'filters'>
  ): Promise<ListResponseType<WalletEntity[]>>
  getOneByField(
    field: keyof WalletEntity,
    value: unknown
  ): Promise<WalletEntity | null>
  // Sem `create`, `update` nem `delete`: essas operações vivem na API, em
  // transacções auditadas. Ver `IAdminMoneyRepository`.
}
