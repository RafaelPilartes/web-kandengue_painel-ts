// import ApiDao from './Api.dao'
// import type { IUserRepository } from '@/core/interfaces/IUserRepository'
// import { UserEntity } from '@/core/entities/User'
// import type { ApiResponse, ListResponseType } from '@/interfaces/IApiResponse'
// import type { UserInterface } from '@/interfaces/IUser'

// export class RestUserDAO implements IUserRepository {
//   private endpoint = '/users'

//   async getAll(): Promise<ListResponseType<UserEntity[]>> {
//     const response = await ApiDao.get<ApiResponse<UserInterface[]>>(
//       `${this.endpoint}/get/all?limit=100&offset=0`
//     )
//     if (response.error || !response.data) throw new Error(response.msg)

//     const users = response.data.map(
//       (user: UserInterface) => new UserEntity(user)
//     )
//     return {
//       data: users,
//       message: response.msg,
//       pagination: response.pagination || null
//     }
//   }

//   async getById(id: string): Promise<ListResponseType<UserEntity> | null> {
//     const response = await ApiDao.get<ApiResponse<UserInterface>>(
//       `${this.endpoint}/get/one/${id}`
//     )
//     if (response.error || !response.data) return null
//     const userData = new UserEntity(response.data)
//     return {
//       data: userData,
//       message: response.msg
//     }
//   }

//   async create(
//     user: Omit<UserEntity, 'id'>
//   ): Promise<ListResponseType<UserEntity>> {
//     const response = await ApiDao.post<ApiResponse<UserInterface>>(
//       `${this.endpoint}/create`,
//       user
//     )
//     if (response.error || !response.data) throw new Error(response.msg)
//     const userData = new UserEntity(response.data)
//     return {
//       data: userData,
//       message: response.msg
//     }
//   }

//   async update(
//     id: string,
//     user: Partial<UserEntity>
//   ): Promise<ListResponseType<UserEntity>> {
//     const response = await ApiDao.put<ApiResponse<UserInterface>>(
//       `${this.endpoint}/update/${id}`,
//       user
//     )
//     if (response.error || !response.data) throw new Error(response.msg)
//     const userData = new UserEntity(response.data)
//     return {
//       data: userData,
//       message: response.msg
//     }
//   }

//   async delete(id: string): Promise<void> {
//     await ApiDao.delete(`${this.endpoint}/delete/${id}`)
//   }
// }
