import axios, { type AxiosResponse } from 'axios'
import { ApiServer } from './api.server'

class ApiDAO {
  private baseUrl: string

  constructor() {
    this.baseUrl = ApiServer
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        headers
      })
      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          error.response.data?.message ||
            error.response.data?.msg ||
            'Unknown error'
        )
      } else if (error.request) {
        throw new Error('No response from server')
      } else {
        throw new Error('Error in request setup')
      }
    }
  }

  public async get<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('GET', url, undefined, headers)
  }

  public async post<T>(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('POST', url, data, headers)
  }

  public async put<T>(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('PUT', url, data, headers)
  }

  public async delete<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('DELETE', url, undefined, headers)
  }
}

export default new ApiDAO()
