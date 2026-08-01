// services/vehicles.service.ts
import { vehicleRepository } from '@/modules/Api'
import { VehicleEntity } from '@/core/entities/Vehicle'
import type { ListResponseType } from '@/interfaces/IApiResponse'

export class VehicleService {
  async getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity[]>> {
    void offset // paginação por offset foi substituída por cursor
    try {
      return await vehicleRepository.getAll({ limit, searchTerm, filters })
    } catch (error: any) {
      console.error('Erro ao buscar veículos:', error)
      throw new Error(error.message || 'Erro ao buscar veículos')
    }
  }

  async getById(id: string): Promise<VehicleEntity | null> {
    try {
      return await vehicleRepository.getById(id)
    } catch (error: any) {
      console.error(`Erro ao buscar veículo ${id}:`, error)
      throw new Error(error.message || 'Erro ao buscar veículo')
    }
  }

  // get one by custom field
  async getOneByField(
    field: string,
    value: any
  ): Promise<VehicleEntity | null> {
    try {
      return await vehicleRepository.getOneByField(
        field as keyof VehicleEntity,
        value
      )
    } catch (error: any) {
      console.error(`Erro ao buscar vehicle por ${field}-${value}:`, error)
      throw new Error(error.message || 'Erro ao buscar vehicle')
    }
  }

  // get by custom field
  async getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<VehicleEntity[]>> {
    void offset
    try {
      const { data, pagination } = await vehicleRepository.getAllByField(
        field as keyof VehicleEntity,
        value,
        { limit }
      )
      return { data, pagination }
    } catch (error: any) {
      console.error(
        `Erro ao buscar veículo pelo campo ${field} com valor ${value}:`,
        error
      )
      throw new Error(error.message || 'Erro ao buscar veículo')
    }
  }

  async create(vehicle: Omit<VehicleEntity, 'id'>): Promise<VehicleEntity> {
    try {
      return await vehicleRepository.create(vehicle as never)
    } catch (error: any) {
      console.error('Erro ao criar veículo:', error)
      throw new Error(error.message || 'Erro ao criar veículo')
    }
  }

  async update(
    id: string,
    vehicle: Partial<VehicleEntity>
  ): Promise<VehicleEntity> {
    try {
      return await vehicleRepository.update(id, vehicle)
    } catch (error: any) {
      console.error(`Erro ao atualizar veículo ${id}:`, error)
      throw new Error(error.message || 'Erro ao atualizar veículo')
    }
  }

  async delete(id: string): Promise<void> {
    try {
      return await vehicleRepository.delete(id)
    } catch (error: any) {
      console.error(`Erro ao deletar veículo ${id}:`, error)
      throw new Error(error.message || 'Erro ao deletar veículo')
    }
  }
}
