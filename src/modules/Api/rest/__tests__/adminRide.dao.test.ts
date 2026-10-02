import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { post }
}))

const { AdminRideDAO } = await import('@/modules/Api/rest/adminRide.dao')

describe('AdminRideDAO', () => {
  const dao = new AdminRideDAO()

  beforeEach(() => {
    post.mockReset()
  })

  it('marca como revista na rota certa', async () => {
    post.mockResolvedValue({ changed: true })

    const result = await dao.markFareReviewed('rid-1')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/rides/rid-1/fare-review',
      {}
    )
    expect(result).toEqual({ changed: true })
  })

  it('envia a nota quando existe', async () => {
    post.mockResolvedValue({ changed: true })

    await dao.markFareReviewed('rid-1', 'Confirmei com o motorista')

    expect(post.mock.calls[0][1]).toEqual({ note: 'Confirmei com o motorista' })
  })

  it('não envia `note` vazia — o schema aceita ausente, não vazio', async () => {
    post.mockResolvedValue({ changed: true })

    await dao.markFareReviewed('rid-1', '')

    expect(post.mock.calls[0][1]).toEqual({})
  })

  it('nunca envia adminId — a API tira-o do token', async () => {
    post.mockResolvedValue({ changed: true })

    await dao.markFareReviewed('rid-1', 'nota')

    expect(JSON.stringify(post.mock.calls[0])).not.toContain('adminId')
  })

  it('propaga o erro da API tal como vem', async () => {
    post.mockRejectedValue(
      new Error('Ride rid-9 is not flagged for fare review')
    )

    await expect(dao.markFareReviewed('rid-9')).rejects.toThrow(/not flagged/)
  })
})
