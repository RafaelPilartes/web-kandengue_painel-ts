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

  async payMissionBonus(input: {
    driver_id: string
    mission_id: string
    type_paid: 'cash' | 'wallet'
  }): Promise<{ paid: boolean; balance: number | null }> {
    return ApiDAO.post('/api/v1/admin/missions/pay', input)
  }

  async createWallet(input: {
    user_id: string
    user: { id: string; firebase_uid: string; [key: string]: unknown }
    initial_balance: number
    currency: string
    status: string
    reason?: string
  }): Promise<{ walletId: string; balance: number }> {
    return ApiDAO.post('/api/v1/admin/wallets', input)
  }

  async setWalletStatus(
    walletId: string,
    status: 'active' | 'inactive',
    reason?: string
  ): Promise<{ changed: boolean; status: 'active' | 'inactive' }> {
    return ApiDAO.patch(`/api/v1/admin/wallets/${walletId}/status`, {
      status,
      reason
    })
  }
}
