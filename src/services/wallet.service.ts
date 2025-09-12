// services/wallets.service.ts
import { walletRepository } from '@/modules/Api'
import { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class WalletService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity[]>> {
    try {
      return await walletRepository.getAll(limit, offset, searchTerm, filters)
    } catch (error: any) {
      console.error('Erro ao buscar carteiras:', error)
      throw new Error(error.message || 'Erro ao buscar carteiras')
    }
  }

  async getById(id: string): Promise<WalletEntity | null> {
    try {
      return await walletRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar carteira')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletEntity[]>> {
    try {
      const { data, pagination } = await walletRepository.getAllByField(
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

  async create(wallet: Omit<WalletEntity, 'id'>): Promise<WalletEntity> {
    try {
      return await walletRepository.create(wallet)
    } catch (error: any) {
      console.error('Erro ao criar carteira:', error)
      throw new Error(error.message || 'Erro ao criar carteira')
    }
  }

  async update(
    id: string,
    wallet: Partial<WalletEntity>
  ): Promise<WalletEntity> {
    try {
      return await walletRepository.update(id, wallet)
    } catch (error: any) {
      console.error(`Erro ao atualizar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar carteira')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await walletRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar carteira ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar carteira')
    }
  }
}
