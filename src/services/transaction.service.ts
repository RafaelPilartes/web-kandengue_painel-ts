import { transactionRepository } from '@/modules/Api'
import { TransactionEntity } from '@/core/entities/Transaction'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class TransactionService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<TransactionEntity[]>> {
    try {
      const { data, pagination } = await transactionRepository.getAll(
        limit,
        offset
      )
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(
    id: string
  ): Promise<ListResponseType<TransactionEntity> | null> {
    try {
      return await transactionRepository.getById(id)
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
  ): Promise<ListResponseType<TransactionEntity[]>> {
    try {
      const { data, pagination } = await transactionRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar transaction pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar transaction')
    }
  }

  async create(
    transaction: Omit<TransactionEntity, 'id'>
  ): Promise<ListResponseType<TransactionEntity>> {
    try {
      return await transactionRepository.create(transaction)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    transaction: Partial<TransactionEntity>
  ): Promise<ListResponseType<TransactionEntity>> {
    try {
      return await transactionRepository.update(id, transaction)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await transactionRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
