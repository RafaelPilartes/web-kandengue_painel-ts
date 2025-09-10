import { vehicleRepository } from '@/modules/Api'
import { VehicleEntity } from '@/core/entities/Vehicle'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class VehicleService {
  async getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<VehicleEntity[]>> {
    try {
      const { data, pagination } = await vehicleRepository.getAll(limit, offset)
      return { data, pagination }
    } catch (error: any) {
      console.error('Erro ao buscar usuários:', error)
      throw new Error(error.message || 'Erro ao buscar usuários')
    }
  }

  async getById(id: string): Promise<ListResponseType<VehicleEntity> | null> {
    try {
      return await vehicleRepository.getById(id)
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
  ): Promise<ListResponseType<VehicleEntity[]>> {
    try {
      const { data, pagination } = await vehicleRepository.getAllByField(
        field,
        value,
        limit,
        offset
      )

      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar vehicle pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar vehicle')
    }
  }

  async create(
    vehicle: Omit<VehicleEntity, 'id'>
  ): Promise<ListResponseType<VehicleEntity>> {
    try {
      return await vehicleRepository.create(vehicle)
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      throw new Error(error.message || 'Erro ao criar usuário')
    }
  }

  async update(
    id: string,
    vehicle: Partial<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity>> {
    try {
      return await vehicleRepository.update(id, vehicle)
    } catch (error: any) {
      console.error(`Erro ao atualizar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar usuário')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await vehicleRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar usuário ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar usuário')
    }
  }
}
