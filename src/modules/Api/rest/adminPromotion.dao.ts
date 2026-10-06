import ApiDAO from './Api.dao'
import type {
  AllowedUsersResult,
  CreatePromotionPayload,
  IAdminPromotionRepository,
  PromotionPayload,
  PromotionWriteResult
} from '@/core/interfaces/IAdminPromotionRepository'

/**
 * O tecto da API, por pedido. A transacção do servidor escreve um documento
 * por utilizador mais o registo de auditoria, e uma transacção do Firestore
 * leva 500 escritas.
 */
const ALLOWED_USERS_CHUNK = 400

/** O código vai no caminho: um `/` ou um espaço colado não pode partir a rota. */
function path(code: string, suffix = ''): string {
  return `/api/v1/admin/promotions/${encodeURIComponent(code)}${suffix}`
}

export class AdminPromotionDAO implements IAdminPromotionRepository {
  async create(
    payload: CreatePromotionPayload
  ): Promise<PromotionWriteResult> {
    return ApiDAO.post('/api/v1/admin/promotions', payload)
  }

  async update(
    code: string,
    payload: PromotionPayload
  ): Promise<PromotionWriteResult> {
    return ApiDAO.put(path(code), payload)
  }

  async setActive(
    code: string,
    active: boolean
  ): Promise<PromotionWriteResult> {
    return ApiDAO.patch(path(code, '/active'), { active })
  }

  /**
   * Parte a lista pelo tecto da API e soma.
   *
   * Em série, de propósito: cada pedido é uma transacção sobre a mesma
   * promoção, e mandá-los todos de uma vez punha o servidor a competir
   * consigo mesmo por um documento que já leu.
   *
   * Cada pedaço deixa o seu registo em `auditLogs` — que é o que de facto
   * aconteceu: um CSV de mil nomes entrou em três operações.
   */
  async addAllowedUsers(
    code: string,
    userIds: string[]
  ): Promise<AllowedUsersResult> {
    const total: AllowedUsersResult = {
      code,
      added: 0,
      already_present: 0
    }

    for (let i = 0; i < userIds.length; i += ALLOWED_USERS_CHUNK) {
      const chunk = userIds.slice(i, i + ALLOWED_USERS_CHUNK)
      const result = await ApiDAO.post<AllowedUsersResult>(
        path(code, '/allowed-users'),
        { user_ids: chunk }
      )
      total.added += result.added
      total.already_present += result.already_present
    }

    return total
  }

  async removeAllowedUser(
    code: string,
    userId: string
  ): Promise<{ code: string; removed: boolean }> {
    return ApiDAO.delete(
      path(code, `/allowed-users/${encodeURIComponent(userId)}`)
    )
  }
}
