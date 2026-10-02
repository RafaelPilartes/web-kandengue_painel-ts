import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { post }
}))

const { AdminVehicleDAO } = await import('@/modules/Api/rest/adminVehicle.dao')

describe('AdminVehicleDAO', () => {
  const dao = new AdminVehicleDAO()

  beforeEach(() => {
    post.mockReset()
  })

  it('validar chama a rota certa e não manda motivo nenhum', async () => {
    post.mockResolvedValue({ changed: true, status: 'validated' })

    const result = await dao.reviewVehicle('veh-1', 'validated')

    // O schema da API é uma união discriminada: um `reason` no braço da
    // validação é 400.
    expect(post).toHaveBeenCalledWith('/api/v1/admin/vehicles/veh-1/review', {
      decision: 'validated'
    })
    expect(result).toEqual({ changed: true, status: 'validated' })
  })

  it('validar não manda `reason` mesmo que lhe passem um', async () => {
    post.mockResolvedValue({ changed: true, status: 'validated' })

    await dao.reviewVehicle('veh-1', 'validated', 'motivo a mais')

    expect(post.mock.calls[0][1]).toEqual({ decision: 'validated' })
  })

  it('recusar envia o motivo no corpo', async () => {
    post.mockResolvedValue({ changed: true, status: 'rejected' })

    const result = await dao.reviewVehicle(
      'veh-1',
      'rejected',
      'Matrícula ilegível'
    )

    expect(post).toHaveBeenCalledWith('/api/v1/admin/vehicles/veh-1/review', {
      decision: 'rejected',
      reason: 'Matrícula ilegível'
    })
    expect(result.status).toBe('rejected')
  })

  it('nunca envia adminId — a API tira-o do token', async () => {
    post.mockResolvedValue({ changed: true, status: 'validated' })

    await dao.reviewVehicle('veh-1', 'validated')

    expect(JSON.stringify(post.mock.calls[0])).not.toContain('adminId')
  })

  it('propaga o erro da API tal como vem', async () => {
    post.mockRejectedValue(
      new Error("Vehicle in status 'validated' cannot be reviewed")
    )

    await expect(dao.reviewVehicle('veh-1', 'rejected', 'x')).rejects.toThrow(
      /cannot be reviewed/
    )
  })
})
