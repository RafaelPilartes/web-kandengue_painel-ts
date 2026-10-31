import axios, { type AxiosResponse } from 'axios'
import { ApiServer } from './api.server'
import { auth } from '@/config/firebase.config'
import { ApiError } from '@/helpers/apiError'

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
      /*
       * ⚠️ **The API's error contract (3.1) reaches the caller intact.**
       *
       * Until now this threw `new Error(data.message)` and the `code` and
       * `details` died right here. 3.7 needs both: when a service approval is
       * refused, **what is missing comes in `details`**, and that is what the
       * admin has to see instead of "requirements not met".
       *
       * Whoever only wants a sentence uses `mapApiError`, which shows the
       * `user_message` when there is one and never a validation's `message`.
       */
      if (error.response) {
        const corpo = error.response.data ?? {}
        throw new ApiError(
          corpo.message || corpo.msg || 'Unknown error',
          error.response.status ?? null,
          typeof corpo.code === 'string' ? corpo.code : null,
          typeof corpo.user_message === 'string' ? corpo.user_message : null,
          corpo.details ?? null
        )
      } else if (error.request) {
        // `status: null` is what `mapApiError` reads as "no answer".
        throw new ApiError('No response from server', null, null, null, null)
      } else {
        throw new ApiError('Error in request setup', null, null, null, null)
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

  /*
   * `data` is optional and almost always absent. It exists for
   * `DELETE /api/v1/admin/devices`, which identifies the browser by its push
   * token: the token is long and opaque, and a query string would put it in
   * every proxy log on the way.
   */
  public async delete<T>(
    url: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>('DELETE', url, data, headers)
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
