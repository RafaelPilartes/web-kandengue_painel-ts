// services/walletTopupRequests.service.ts
import { walletTopupRequestRepository, adminMoneyRepository } from '@/modules/Api'
import { WalletTopupRequestEntity } from '@/core/entities/WalletTopupRequest'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class WalletTopupRequestService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletTopupRequestEntity>
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
    try {
      return await walletTopupRequestRepository.getAll(
        limit,
        offset,
        searchTerm,
        filters
      )
    } catch (error: any) {
      console.error('Erro ao buscar carteiras:', error)
      throw new Error(error.message || 'Erro ao buscar carteiras')
    }
  }

  async getById(id: string): Promise<WalletTopupRequestEntity | null> {
    try {
      return await walletTopupRequestRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar carteira')
    }
  }

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<WalletTopupRequestEntity | null> {
    try {
      return await walletTopupRequestRepository.getOneByField(field, value)
    } catch (error: any) {
      console.error(
        `Erro ao buscar walletTopupRequest por ${field}-${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar walletTopupRequest')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletTopupRequestEntity[]>> {
    try {
      const { data, pagination } =
        await walletTopupRequestRepository.getAllByField(
          field,
          value,
          limit,
          offset
        )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar carteira pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar carteira')
    }
  }

  async create(
    walletTopupRequest: Omit<WalletTopupRequestEntity, 'id'>
  ): Promise<WalletTopupRequestEntity> {
    try {
      return await walletTopupRequestRepository.create(walletTopupRequest)
    } catch (error: any) {
      console.error('Erro ao criar carteira:', error)
      throw new Error(error.message || 'Erro ao criar carteira')
    }
  }

  async update(
    id: string,
    walletTopupRequest: Partial<WalletTopupRequestEntity>
  ): Promise<WalletTopupRequestEntity> {
    try {
      return await walletTopupRequestRepository.update(id, walletTopupRequest)
    } catch (error: any) {
      console.error(`Erro ao atualizar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar carteira')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await walletTopupRequestRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar carteira')
    }
  }

  /**
   * Aprova e credita no servidor, numa transacção idempotente.
   * `credited: false` significa que já estava aprovado — não é erro.
   */
  async approveTopup(
    id: string
  ): Promise<{ credited: boolean; balance: number }> {
    return adminMoneyRepository.approveTopup(id)
  }
}
