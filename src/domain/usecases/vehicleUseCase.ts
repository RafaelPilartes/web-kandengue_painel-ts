import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { AppError } from '@/domain/errors/AppError'
import type { VehicleEntity } from '@/core/entities/Vehicle'
import type { QueryOptions } from '@/core/interfaces/IBaseRepository'
import type { ListResponseType } from '@/interfaces/IApiResponse'

type NewVehicle = Omit<VehicleEntity, 'id' | 'created_at' | 'updated_at'>

export class VehicleUseCase extends BaseUseCase {
  protected readonly context = 'VehicleUseCase'

  private get repository() {
    return ApiRepository.vehicles
  }

  executeGetAll(
    options?: QueryOptions<VehicleEntity>
  ): Promise<ListResponseType<VehicleEntity[]>> {
    return this.run('getAll', () => this.repository.getAll(options))
  }

  executeGetById(id: string): Promise<VehicleEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetAllByField(
    field: keyof VehicleEntity,
    value: unknown,
    options?: Omit<QueryOptions<VehicleEntity>, 'filters'>
  ): Promise<ListResponseType<VehicleEntity[]>> {
    return this.run('getAllByField', () =>
      this.repository.getAllByField(field, value, options)
    )
  }

  executeGetOneByField(
    field: keyof VehicleEntity,
    value: unknown
  ): Promise<VehicleEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeCreate(data: NewVehicle): Promise<VehicleEntity> {
    return this.run('create', async () => {
      const plate = data.plate?.trim().toLowerCase() ?? ''
      if (!plate) {
        throw new AppError('failed-precondition', 'A matrícula é obrigatória.')
      }
      // Normalizar em minúsculas é o que faz a pesquisa por prefixo funcionar.
      return this.repository.create({ ...data, plate })
    })
  }

  executeUpdate(
    id: string,
    data: Partial<VehicleEntity>
  ): Promise<VehicleEntity> {
    return this.run('update', () => {
      const patch = data.plate
        ? { ...data, plate: data.plate.trim().toLowerCase() }
        : data
      return this.repository.update(id, patch)
    })
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }
}

export const vehicleUseCase = new VehicleUseCase()
