import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
const put = vi.fn()
const patch = vi.fn()
const del = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { post, put, patch, delete: del }
}))

const { AdminPromotionDAO } = await import(
  '@/modules/Api/rest/adminPromotion.dao'
)

const PAYLOAD = {
  type: 'percentage' as const,
  value: 40,
  max_discount: 2000,
  valid_from: new Date('2026-01-01T00:00:00.000Z'),
  valid_until: new Date('2026-06-01T00:00:00.000Z'),
  active: true,
  rules: { ride_types: ['delivery' as const] }
}

describe('AdminPromotionDAO', () => {
  const dao = new AdminPromotionDAO()

  beforeEach(() => {
    post.mockReset()
    put.mockReset()
    patch.mockReset()
    del.mockReset()
  })

  it('cria na colecção, com o código no corpo', async () => {
    post.mockResolvedValue({
      code: 'VERAO40',
      changed: true,
      changed_fields: ['type']
    })

    const result = await dao.create({ code: 'VERAO40', ...PAYLOAD })

    expect(post).toHaveBeenCalledWith('/api/v1/admin/promotions', {
      code: 'VERAO40',
      ...PAYLOAD
    })
    expect(result.code).toBe('VERAO40')
  })

  it('edita pelo código no caminho, e o código não vai no corpo', async () => {
    put.mockResolvedValue({
      code: 'RAFAEL11',
      changed: true,
      changed_fields: ['valid_until']
    })

    await dao.update('RAFAEL11', PAYLOAD)

    expect(put).toHaveBeenCalledWith(
      '/api/v1/admin/promotions/RAFAEL11',
      PAYLOAD
    )
    expect(JSON.stringify(put.mock.calls[0][1])).not.toContain('"code"')
  })

  it('o interruptor é um PATCH com um campo só', async () => {
    patch.mockResolvedValue({
      code: 'RAFAEL11',
      changed: true,
      changed_fields: ['active']
    })

    await dao.setActive('RAFAEL11', false)

    expect(patch).toHaveBeenCalledWith(
      '/api/v1/admin/promotions/RAFAEL11/active',
      { active: false }
    )
  })

  /**
   * Um código com um caractere que parta a rota não existe (o schema da API
   * só aceita `[A-Z0-9_-]`), mas uma promoção legada pode tê-lo — e o id do
   * documento não se muda.
   */
  it('codifica o código e o utilizador no caminho', async () => {
    del.mockResolvedValue({ code: 'PROMO ANTIGA', removed: true })

    await dao.removeAllowedUser('PROMO ANTIGA', 'us/1')

    expect(del).toHaveBeenCalledWith(
      '/api/v1/admin/promotions/PROMO%20ANTIGA/allowed-users/us%2F1'
    )
  })

  it('nunca envia adminId — a API tira-o do token', async () => {
    post.mockResolvedValue({ code: 'X', changed: true, changed_fields: [] })

    await dao.create({ code: 'X', ...PAYLOAD })

    expect(JSON.stringify(post.mock.calls[0])).not.toContain('adminId')
    expect(JSON.stringify(post.mock.calls[0])).not.toContain('added_by')
  })

  describe('addAllowedUsers — os pedaços', () => {
    it('uma lista curta é um pedido só', async () => {
      post.mockResolvedValue({ code: 'C', added: 2, already_present: 0 })

      const result = await dao.addAllowedUsers('C', ['us-1', 'us-2'])

      expect(post).toHaveBeenCalledTimes(1)
      expect(post).toHaveBeenCalledWith(
        '/api/v1/admin/promotions/C/allowed-users',
        { user_ids: ['us-1', 'us-2'] }
      )
      expect(result).toEqual({ code: 'C', added: 2, already_present: 0 })
    })

    it('parte nos 400 e soma os resultados', async () => {
      const ids = Array.from({ length: 900 }, (_, i) => `us-${i}`)
      post
        .mockResolvedValueOnce({ code: 'C', added: 400, already_present: 0 })
        .mockResolvedValueOnce({ code: 'C', added: 350, already_present: 50 })
        .mockResolvedValueOnce({ code: 'C', added: 100, already_present: 0 })

      const result = await dao.addAllowedUsers('C', ids)

      expect(post).toHaveBeenCalledTimes(3)
      expect(post.mock.calls[0][1].user_ids).toHaveLength(400)
      expect(post.mock.calls[1][1].user_ids).toHaveLength(400)
      expect(post.mock.calls[2][1].user_ids).toHaveLength(100)
      // Cada pedaço é uma transacção e um registo de auditoria; o ecrã mostra
      // o total.
      expect(result).toEqual({ code: 'C', added: 850, already_present: 50 })
    })

    it('uma lista vazia não chama a API', async () => {
      const result = await dao.addAllowedUsers('C', [])

      expect(post).not.toHaveBeenCalled()
      expect(result).toEqual({ code: 'C', added: 0, already_present: 0 })
    })

    it('se um pedaço falha, o erro sobe com a mensagem da API', async () => {
      const ids = Array.from({ length: 500 }, (_, i) => `us-${i}`)
      post
        .mockResolvedValueOnce({ code: 'C', added: 400, already_present: 0 })
        .mockRejectedValueOnce(new Error('Promoção não encontrada: C'))

      await expect(dao.addAllowedUsers('C', ids)).rejects.toThrow(
        /não encontrada/
      )
    })
  })
})
