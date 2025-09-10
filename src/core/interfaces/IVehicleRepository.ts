import type { ListResponseType } from '@/interfaces/IApiResponse'
import { VehicleEntity } from '../entities/Vehicle'

export interface IVehicleRepository {
  getAll(
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<VehicleEntity[]>>
  getById(id: string): Promise<ListResponseType<VehicleEntity> | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<VehicleEntity[]>>
  create(
    Vehicle: Omit<VehicleEntity, 'id'>
  ): Promise<ListResponseType<VehicleEntity>>
  update(
    id: string,
    Vehicle: Partial<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity>>
  delete(id: string): Promise<void>
}
