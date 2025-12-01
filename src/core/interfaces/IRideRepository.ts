// core/interfaces/IRideRepository.ts
import type { ListResponseType } from '@/interfaces/IApiResponse'
import { RideEntity } from '../entities/Ride'

export interface IRideRepository {
  getAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<RideEntity>
  ): Promise<ListResponseType<RideEntity[]>>
  getById(id: string): Promise<RideEntity | null>
  getAllByField(
    field: string,
    value: any,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<RideEntity[]>>
  getOneByField(field: string, value: any): Promise<RideEntity | null>
  create(Ride: Omit<RideEntity, 'id'>): Promise<RideEntity>
  update(id: string, Ride: Partial<RideEntity>): Promise<RideEntity>
  delete(id: string): Promise<void>
  listenById(
    id: string,
    onUpdate: (driver: RideEntity) => void,
    onError?: (err: Error) => void
  ): () => void
  listenByField(
    field: keyof RideEntity,
    value: string,
    onUpdate: (driver: RideEntity) => void,
    onError?: (err: Error) => void
  ): () => void

  listenAllByField(
    field: keyof RideEntity,
    value: any,
    onUpdate: (rides: RideEntity[]) => void,
    onError?: (err: Error) => void,
    options?: {
      limit?: number
      orderBy?: keyof RideEntity
      orderDirection?: 'asc' | 'desc'
    }
  ): () => void

  listenAll(
    onUpdate: (rides: RideEntity[]) => void,
    onError?: (err: Error) => void,
    options?: {
      filters?: Partial<RideEntity>
      limit?: number
      orderBy?: keyof RideEntity
      orderDirection?: 'asc' | 'desc'
    }
  ): () => void
}
