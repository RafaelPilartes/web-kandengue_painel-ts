import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { AppError } from '@/domain/errors/AppError'
import type { UserEntity } from '@/core/entities/User'
import type { ListResponseType } from '@/interfaces/IApiResponse'
import type { FieldPath } from '@/core/interfaces/IBaseRepository'

// Defaults do DAO antigo — preservados aqui para o motor novo (que usa 50).
const LEGACY_PAGE_SIZE = 500
const LEGACY_FIELD_PAGE_SIZE = 10

export class UserUseCase extends BaseUseCase {
  protected readonly context = 'UserUseCase'

  private get repository() {
    return ApiRepository.users
  }

  executeGetAll(
    limit?: number,
    offset?: number,
    searchTerm?: string,
    filters?: Partial<UserEntity>
  ): Promise<ListResponseType<UserEntity[]>> {
    return this.run('getAll', async () => {
      const base = { searchTerm, filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)
      return this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_PAGE_SIZE,
        after
      })
    })
  }

  executeGetById(id: string): Promise<UserEntity | null> {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeGetByEmail(email: string): Promise<UserEntity | null> {
    return this.run('getByEmail', () => this.repository.getByEmail(email))
  }

  executeGetOneByField(
    field: FieldPath<UserEntity>,
    value: unknown
  ): Promise<UserEntity | null> {
    return this.run('getOneByField', () =>
      this.repository.getOneByField(field, value)
    )
  }

  executeGetAllByField(
    field: FieldPath<UserEntity>,
    value: unknown,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<UserEntity[]>> {
    return this.run('getAllByField', async () => {
      const filters = { [field]: value } as Partial<UserEntity>
      const base = { filters }
      const after = await this.offsetToCursor(this.repository, base, offset ?? 0)

      const { data, pagination } = await this.repository.getAll({
        ...base,
        limit: limit ?? LEGACY_FIELD_PAGE_SIZE,
        after
      })

      return { data, pagination }
    })
  }

  executeCreate(user: Omit<UserEntity, 'id'>): Promise<UserEntity> {
    return this.run('create', () => {
      if (!user.name || !user.email) {
        throw new AppError(
          'failed-precondition',
          'Nome e email são obrigatórios.'
        )
      }
      return this.repository.create(user)
    })
  }

  executeUpdate(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
    return this.run('update', () => this.repository.update(id, user))
  }

  executeDelete(id: string): Promise<void> {
    return this.run('delete', () => this.repository.delete(id))
  }

  /**
   * Marca `status: 'deleted'` sem apagar o documento e, se `firebaseUid` for
   * o do utilizador com sessão iniciada, apaga também a conta no Firebase
   * Auth. Assinatura preservada — o ViewModel depende dela.
   */
  executeSoftDelete(id: string, firebaseUid?: string): Promise<void> {
    return this.run('softDelete', () =>
      this.repository.softDelete(id, firebaseUid)
    )
  }
}

export const userUseCase = new UserUseCase()
