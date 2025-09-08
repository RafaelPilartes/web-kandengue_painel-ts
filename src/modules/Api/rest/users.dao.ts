import ApiDao from './Api.dao'
import type { IUserRepository } from '@/core/interfaces/IUserRepository'
import { User } from '@/core/entities/User'
import type { ApiResponse, ListResponseType } from '@/interfaces/IApiResponse'
import type { UserInterface } from '@/interfaces/IUser'

export class RestUserDAO implements IUserRepository {
  private endpoint = '/users'

  async getAll(): Promise<ListResponseType<User[]>> {
    const response = await ApiDao.get<ApiResponse<UserInterface[]>>(
      `${this.endpoint}/get/all?limit=100&offset=0`
    )
    if (response.error || !response.data) throw new Error(response.msg)

    const users = response.data.map((user: UserInterface) => new User(user))
    return {
      data: users,
      message: response.msg,
      pagination: response.pagination || null
    }
  }

  async getById(id: string): Promise<ListResponseType<User> | null> {
    const response = await ApiDao.get<ApiResponse<UserInterface>>(
      `${this.endpoint}/get/one/${id}`
    )
    if (response.error || !response.data) return null
    const userData = new User(response.data)
    return {
      data: userData,
      message: response.msg
    }
  }

  async create(user: Omit<User, 'id'>): Promise<ListResponseType<User>> {
    const response = await ApiDao.post<ApiResponse<UserInterface>>(
      `${this.endpoint}/create`,
      user
    )
    if (response.error || !response.data) throw new Error(response.msg)
    const userData = new User(response.data)
    return {
      data: userData,
      message: response.msg
    }
  }

  async update(
    id: string,
    user: Partial<User>
  ): Promise<ListResponseType<User>> {
    const response = await ApiDao.put<ApiResponse<UserInterface>>(
      `${this.endpoint}/update/${id}`,
      user
    )
    if (response.error || !response.data) throw new Error(response.msg)
    const userData = new User(response.data)
    return {
      data: userData,
      message: response.msg
    }
  }

  async delete(id: string): Promise<void> {
    await ApiDao.delete(`${this.endpoint}/delete/${id}`)
  }
}
