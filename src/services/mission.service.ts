import {
  missionRepository,
  rideRepository,
  walletRepository,
  transactionRepository
} from '@/modules/Api'
import { MissionEntity } from '@/core/entities/Mission'
import { MissionProgressEntity } from '@/core/entities/MissionProgress'
import { TransactionEntity } from '@/core/entities/Transaction'
import { generateId } from '@/helpers/generateId'
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns'

export class MissionService {
  async getAllMissions() {
    return await missionRepository.getAll()
  }

  async getActiveMissions() {
    return await missionRepository.getAll(100, 0, undefined, {
      is_active: true
    })
  }

  async getById(id: string) {
    return await missionRepository.getById(id)
  }

  async createMission(mission: Omit<MissionEntity, 'id'>) {
    return await missionRepository.create(mission)
  }

  async updateMission(id: string, mission: Partial<MissionEntity>) {
    return await missionRepository.update(id, mission)
  }

  async deleteMission(id: string) {
    return await missionRepository.delete(id)
  }

  async getDriverProgress(driver_id: string) {
    try {
      const res = await missionRepository.getAllProgressByDriver(driver_id)

      if (res.length === 0) {
        await this.updateDriverProgress(driver_id)
        return await missionRepository.getAllProgressByDriver(driver_id)
      }

      return res
    } catch (error) {
      console.error(
        `Error in getDriverProgress for driver ${driver_id}:`,
        error
      )
      throw error
    }
  }

  async updateDriverProgress(driver_id: string) {
    try {
      const activeMissions = (await this.getActiveMissions()).data
      console.info(
        `Updating progress for driver ${driver_id}. Found ${activeMissions.length} active missions.`
      )

      for (const mission of activeMissions) {
        await this.processMissionProgress(driver_id, mission)
      }
    } catch (error) {
      console.error(
        `CRITICAL: Error updating progress for driver ${driver_id}:`,
        error
      )
      throw error
    }
  }

  private async processMissionProgress(
    driver_id: string,
    mission: MissionEntity
  ) {
    console.log(`[processMissionProgress] Starting for mission ${mission.id}`)
    let progress = await missionRepository.getProgress(driver_id, mission.id)

    const now = new Date()
    let startDate: Date

    switch (mission.type) {
      case 'daily':
        startDate = startOfDay(now)
        break
      case 'weekly':
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        break
      case 'monthly':
        startDate = startOfMonth(now)
        break
      default:
        startDate = startOfDay(now)
    }

    if (
      progress &&
      progress.last_updated &&
      isAfter(startDate, progress.last_updated)
    ) {
      console.log(
        `[processMissionProgress] Resetting progress for a new cycle.`
      )
      progress.current_count = 0
      progress.completed_ride_ids = []
      progress.is_completed = false
      progress.completed_at = undefined
      progress.is_paid = false
      progress.type_paid = undefined
    }

    if (!progress) {
      console.log(
        `[processMissionProgress] Creating new progress entity for mission ${mission.id}`
      )
      progress = new MissionProgressEntity({
        driver_id,
        mission_id: mission.id,
        current_count: 0,
        completed_ride_ids: [],
        is_completed: false,
        is_paid: false
      })
    }

    if (progress.is_completed) {
      console.log(
        `[processMissionProgress] Mission already completed. Skipping ride check.`
      )
      // We still update to persist any potential reset or just to be safe
    } else {
      let rides: { data: any[] } = { data: [] }
      try {
        rides = await rideRepository.getAll(1000, 0, undefined, {
          'driver.id': driver_id,
          status: 'completed'
        } as any)
      } catch (error) {
        console.error(`[processMissionProgress] Error fetching rides:`, error)
        return
      }

      const newRidesInCycle = rides.data.filter(ride => {
        let completedAt = ride.completed_at || ride.created_at
        if (completedAt && (completedAt as any).toDate) {
          completedAt = (completedAt as any).toDate()
        }
        const isInCycle = completedAt && isAfter(completedAt, startDate)
        const rideIds = progress!.completed_ride_ids || []
        const isNew = !rideIds.includes(ride.id!)
        return isInCycle && isNew
      })

      if (newRidesInCycle.length > 0) {
        if (!Array.isArray(progress.completed_ride_ids)) {
          progress.completed_ride_ids = []
        }
        progress.completed_ride_ids.push(...newRidesInCycle.map(r => r.id!))
        progress.current_count = progress.completed_ride_ids.length
        console.info(
          `Added ${newRidesInCycle.length} new rides to driver ${driver_id} mission ${mission.id}. Current count: ${progress.current_count}`
        )
      }

      if (progress.current_count >= mission.target && !progress.is_completed) {
        console.log(
          `[processMissionProgress] Goal reached for mission ${mission.id}`
        )
        progress.is_completed = true
        progress.completed_at = now
        // Automatic payment REMOVED as per user request
      }
    }

    console.log(
      `[processMissionProgress] Updating progress in repository for mission ${mission.id}`
    )
    try {
      await missionRepository.updateProgress(progress)
      console.log(`[processMissionProgress] Progress updated successfully.`)
    } catch (e) {
      console.error(`[processMissionProgress] Failed to update progress:`, e)
      throw e
    }
  }

  async payMissionProgress(
    driver_id: string,
    mission_id: string,
    type_paid: 'cash' | 'wallet'
  ) {
    console.log(
      `[payMissionProgress] Paying driver ${driver_id} for mission ${mission_id} via ${type_paid}`
    )

    const progress = await missionRepository.getProgress(driver_id, mission_id)

    if (!progress) throw new Error('Progresso não encontrado')
    if (!progress.is_completed) throw new Error('Missão ainda não concluída')
    if (progress.is_paid) throw new Error('Missão já paga')

    const mission = await missionRepository.getById(mission_id)
    if (!mission) throw new Error('Missão não encontrada')

    if (type_paid === 'wallet') {
      await this.payMissionBonus(driver_id, mission)
    }

    progress.is_paid = true
    progress.type_paid = type_paid
    await missionRepository.updateProgress(progress)

    return progress
  }

  private async payMissionBonus(driver_id: string, mission: MissionEntity) {
    console.log(
      `[payMissionBonus] Starting payment for driver ${driver_id}, amount: ${mission.reward}`
    )

    // Attempt to find wallet by driver_id OR user.id
    let wallet = await walletRepository.getOneByField('driver_id', driver_id)
    if (!wallet) {
      console.log(
        `[payMissionBonus] Wallet not found by driver_id, trying user.id...`
      )
      wallet = await walletRepository.getOneByField('user.id', driver_id)
    }

    if (!wallet) {
      const errorMsg = `Wallet not found for driver ${driver_id}`
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    console.log(
      `[payMissionBonus] Found wallet ${wallet.id}. Creating transaction...`
    )
    const transactionId = generateId('tra')
    const transaction = new TransactionEntity({
      id: transactionId,
      user_id: driver_id,
      wallet_id: wallet.id!,
      type: 'credit',
      category: 'mission_bonus' as any,
      amount: mission.reward,
      status: 'success',
      description: `Bônus de Missão: ${mission.type} (${mission.target} entregas)`,
      reference_id: mission.id,
      created_at: new Date()
    })

    try {
      await transactionRepository.create(transaction)
      console.log(`[payMissionBonus] Transaction ${transactionId} created.`)
    } catch (e) {
      console.error(`[payMissionBonus] Failed to create transaction:`, e)
      throw e
    }

    const newBalance = (wallet.balance || 0) + mission.reward
    console.log(
      `[payMissionBonus] Updating wallet ${wallet.id} balance to ${newBalance}`
    )
    try {
      await walletRepository.update(wallet.id!, { balance: newBalance })
      console.log(`[payMissionBonus] Wallet updated successfully.`)
    } catch (e) {
      console.error(`[payMissionBonus] Failed to update wallet balance:`, e)
      throw e
    }
  }
}
