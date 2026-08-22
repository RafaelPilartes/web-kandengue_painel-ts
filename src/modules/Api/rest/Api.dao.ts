import axios, { type AxiosResponse } from 'axios'
import { ApiServer } from './api.server'
import { auth } from '@/config/firebase.config'

class ApiDAO {
  private baseUrl: string

  constructor() {
    this.baseUrl = ApiServer
  }

  /**
   * Obtém o ID token da sessão.
   *
   * Distingue dois casos que não são o mesmo: sem sessão, o pedido segue sem
   * header e quem exigir autenticação responde 401 — que é a mensagem certa
   * para um endpoint público. Com sessão mas token irrenovável (revogada,
   * rede, relógio), mascarar isso como pedido anónimo dava ao admin um 401
   * genérico a meio de uma aprovação de dinheiro.
   */
  private async authHeader(): Promise<Record<string, string>> {
    const user = auth.currentUser
    if (!user) return {}

    try {
      return { Authorization: `Bearer ${await user.getIdToken()}` }
    } catch {
      throw new Error('Sessão expirada. Inicie sessão novamente.')
    }
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    // Fora do try/catch de baixo de propósito: um erro daqui (sessão
    // expirada) não é um erro de rede/HTTP e não pode ser remapeado para
    // "Error in request setup" — o admin precisa da mensagem real.
    // Os headers do chamador vêm depois, para um Authorization explícito
    // continuar a ganhar — `pushNotification.dao.ts` passa o seu.
    //
    // Quando o chamador já traz o seu próprio Authorization (ex.: o token
    // FCM do pushNotification.dao.ts, que não tem nada a ver com a sessão
    // do admin), nem chamamos authHeader() — caso contrário uma sessão
    // com token irrenovável fazia authHeader() rebentar por uma
    // autenticação de que este pedido nunca precisou.
    const merged = headers?.Authorization
      ? headers
      : { ...(await this.authHeader()), ...headers }

    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.baseUrl}${url}`,
        data,
        headers: merged
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

  public async patch<T>(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('PATCH', url, data, headers)
  }
}

export default new ApiDAO()
