import { describe, it, expect, vi, beforeEach } from 'vitest'

const del = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { delete: del }
}))

const { AdminNotificationDAO } = await import(
  '@/modules/Api/rest/adminNotification.dao'
)

describe('AdminNotificationDAO', () => {
  const dao = new AdminNotificationDAO()

  beforeEach(() => {
    del.mockReset()
  })

  it('apaga pela rota de admin, com o id no caminho', async () => {
    del.mockResolvedValue({ id: 'nft-1', deleted: true })

    const result = await dao.deleteNotification('nft-1')

    expect(del).toHaveBeenCalledWith('/api/v1/admin/notifications/nft-1')
    expect(result).toEqual({ id: 'nft-1', deleted: true })
  })

  it('`deleted: false` quando já não existia — não é erro', async () => {
    del.mockResolvedValue({ id: 'nft-9', deleted: false })

    expect(await dao.deleteNotification('nft-9')).toEqual({
      id: 'nft-9',
      deleted: false
    })
  })

  it('codifica o id no caminho', async () => {
    del.mockResolvedValue({ id: 'a/b', deleted: true })

    await dao.deleteNotification('a/b')

    expect(del).toHaveBeenCalledWith('/api/v1/admin/notifications/a%2Fb')
  })
})
