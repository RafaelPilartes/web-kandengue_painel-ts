import ApiDAO from './Api.dao'
import type { IAdminMoneyRepository } from '@/core/interfaces/IAdminMoneyRepository'

export class AdminMoneyDAO implements IAdminMoneyRepository {
  async approveTopup(
    topupId: string
  ): Promise<{ credited: boolean; balance: number }> {
    return ApiDAO.post(`/api/v1/admin/topups/${topupId}/approve`, {})
  }

  async approveWithdrawal(
    withdrawalId: string
  ): Promise<{ changed: boolean }> {
    return ApiDAO.post(`/api/v1/admin/withdrawals/${withdrawalId}/approve`, {})
  }

  async rejectWithdrawal(
    withdrawalId: string,
    reason: string
  ): Promise<{ changed: boolean; revertedEarnings: number }> {
    return ApiDAO.post(`/api/v1/admin/withdrawals/${withdrawalId}/reject`, {
      reason
    })
  }

  async markWithdrawalPaid(
    withdrawalId: string
  ): Promise<{ changed: boolean; paidEarnings: number }> {
    return ApiDAO.post(
      `/api/v1/admin/withdrawals/${withdrawalId}/mark-paid`,
      {}
    )
  }
}
