// core/interfaces/IVehicleRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { VehicleEntity } from '../entities/Vehicle'

export interface IVehicleRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity[]>>
  getById(id: string): Promise<VehicleEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<VehicleEntity[]>>
  getOneByField(field: string, value: any): Promise<VehicleEntity | null>
  create(Vehicle: Omit<VehicleEntity, 'id'>): Promise<VehicleEntity>
  update(id: string, Vehicle: Partial<VehicleEntity>): Promise<VehicleEntity>
  delete(id: string): Promise<void>
}
