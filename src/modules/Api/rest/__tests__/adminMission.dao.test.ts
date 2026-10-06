import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { post }
}))

const { AdminMissionDAO } = await import('@/modules/Api/rest/adminMission.dao')

describe('AdminMissionDAO', () => {
  const dao = new AdminMissionDAO()

  beforeEach(() => {
    post.mockReset()
  })

  it('chama a rota do recálculo com o motorista no caminho', async () => {
    post.mockResolvedValue({
      driver_id: 'dri-1',
      missions: 2,
      changed: 1,
      details: [],
      truncated: false
    })

    const result = await dao.recalculateProgress('dri-1')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/drivers/dri-1/mission-progress/recalculate',
      {}
    )
    expect(result.changed).toBe(1)
  })

  it('codifica o id do motorista no caminho', async () => {
    post.mockResolvedValue({
      driver_id: 'dri/1',
      missions: 0,
      changed: 0,
      details: [],
      truncated: false
    })

    await dao.recalculateProgress('dri/1')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/drivers/dri%2F1/mission-progress/recalculate',
      {}
    )
  })

  it('nunca envia adminId — a API tira-o do token', async () => {
    post.mockResolvedValue({
      driver_id: 'dri-1',
      missions: 0,
      changed: 0,
      details: [],
      truncated: false
    })

    await dao.recalculateProgress('dri-1')

    expect(JSON.stringify(post.mock.calls[0])).not.toContain('adminId')
  })

  it('propaga o erro da API tal como vem', async () => {
    post.mockRejectedValue(new Error('Driver not found: dri-9'))

    await expect(dao.recalculateProgress('dri-9')).rejects.toThrow(
      /Driver not found/
    )
  })
})
