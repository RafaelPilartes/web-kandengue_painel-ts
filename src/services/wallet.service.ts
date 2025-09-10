import { walletRepository } from '@/modules/Api'
import { WalletEntity } from '@/core/entities/Wallet'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class WalletService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<WalletEntity[]>> {
    try {
      const { data, pagination } = await walletRepository.getAll(limit, offset)
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(id: string): Promise<ListResponseType<WalletEntity> | null> {
    try {
      return await walletRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar usuário')
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
        `Erro ao buscar wallet pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar wallet')
    }
  }

  async create(
    wallet: Omit<WalletEntity, 'id'>
  ): Promise<ListResponseType<WalletEntity>> {
    try {
      return await walletRepository.create(wallet)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    wallet: Partial<WalletEntity>
  ): Promise<ListResponseType<WalletEntity>> {
    try {
      return await walletRepository.update(id, wallet)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await walletRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
