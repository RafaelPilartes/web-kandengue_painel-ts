import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('@/modules/Api/rest/Api.dao', () => ({
  default: { post }
}))

const { AdminMoneyDAO } = await import('@/modules/Api/rest/adminMoney.dao')

describe('AdminMoneyDAO', () => {
  const dao = new AdminMoneyDAO()

  beforeEach(() => {
    post.mockReset()
  })

  it('approveTopup chama a rota certa e devolve o corpo', async () => {
    post.mockResolvedValue({ credited: true, balance: 6000 })

    const result = await dao.approveTopup('top-1')

    expect(post).toHaveBeenCalledWith('/api/v1/admin/topups/top-1/approve', {})
    expect(result).toEqual({ credited: true, balance: 6000 })
  })

  it('rejectTopup envia o motivo no body', async () => {
    post.mockResolvedValue({ changed: true })

    const result = await dao.rejectTopup('top-1', 'Comprovativo ilegível')

    expect(post).toHaveBeenCalledWith('/api/v1/admin/topups/top-1/reject', {
      reason: 'Comprovativo ilegível'
    })
    expect(result).toEqual({ changed: true })
  })

  it('rejectTopup não envia adminId — a API tira-o do token', async () => {
    post.mockResolvedValue({ changed: true })

    await dao.rejectTopup('top-1', 'motivo')

    expect(JSON.stringify(post.mock.calls[0])).not.toContain('adminId')
  })

  it('approveWithdrawal chama a rota certa', async () => {
    post.mockResolvedValue({ changed: true })

    const result = await dao.approveWithdrawal('wd-1')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/withdrawals/wd-1/approve',
      {}
    )
    expect(result).toEqual({ changed: true })
  })

  it('rejectWithdrawal envia o motivo no body', async () => {
    post.mockResolvedValue({ changed: true, revertedEarnings: 2 })

    const result = await dao.rejectWithdrawal('wd-1', 'dados inválidos')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/withdrawals/wd-1/reject',
      { reason: 'dados inválidos' }
    )
    expect(result.revertedEarnings).toBe(2)
  })

  it('markWithdrawalPaid chama a rota certa', async () => {
    post.mockResolvedValue({ changed: true, paidEarnings: 3 })

    const result = await dao.markWithdrawalPaid('wd-1')

    expect(post).toHaveBeenCalledWith(
      '/api/v1/admin/withdrawals/wd-1/mark-paid',
      {}
    )
    expect(result.paidEarnings).toBe(3)
  })

  it('nunca envia adminId — a API tira-o do token', async () => {
    post.mockResolvedValue({ changed: true })

    await dao.approveWithdrawal('wd-1')

    expect(JSON.stringify(post.mock.calls[0])).not.toContain('adminId')
  })

  it('propaga o erro da API tal como vem', async () => {
    post.mockRejectedValue(new Error('Withdrawal not found: wd-9'))

    await expect(dao.approveWithdrawal('wd-9')).rejects.toThrow(
      'Withdrawal not found: wd-9'
    )
  })
})
