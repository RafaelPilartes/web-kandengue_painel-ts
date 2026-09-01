import { ApiRepository } from '@/modules/Api/factory'
import { BaseUseCase } from './BaseUseCase'
import { MissionEntity } from '@/core/entities/Mission'
import { MissionProgressEntity } from '@/core/entities/MissionProgress'
import type { RideEntity } from '@/core/entities/Ride'
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns'

export class MissionUseCase extends BaseUseCase {
  protected readonly context = 'MissionUseCase'

  private get repository() {
    return ApiRepository.missions
  }

  // O DAO de progresso vive à parte (colecção `missionProgress`).
  private get progressRepository() {
    return ApiRepository.missionProgress
  }

  private get rideRepository() {
    return ApiRepository.rides
  }

  executeGetAllMissions() {
    return this.run('getAllMissions', () => this.repository.getAll())
  }

  executeGetActiveMissions() {
    return this.run('getActiveMissions', () =>
      this.repository.getAll({
        limit: 100,
        filters: { is_active: true }
      })
    )
  }

  executeGetById(id: string) {
    return this.run('getById', () => this.repository.getById(id))
  }

  executeCreateMission(mission: Omit<MissionEntity, 'id'>) {
    return this.run('createMission', () => this.repository.create(mission))
  }

  executeUpdateMission(id: string, mission: Partial<MissionEntity>) {
    return this.run('updateMission', () =>
      this.repository.update(id, mission)
    )
  }

  executeDeleteMission(id: string) {
    return this.run('deleteMission', () => this.repository.delete(id))
  }

  executeGetDriverProgress(driver_id: string) {
    return this.run('getDriverProgress', async () => {
      const res = await this.progressRepository.getAllProgressByDriver(
        driver_id
      )

      if (res.length === 0) {
        await this.updateDriverProgress(driver_id)
        return await this.progressRepository.getAllProgressByDriver(
          driver_id
        )
      }

      return res
    })
  }

  executeUpdateDriverProgress(driver_id: string) {
    return this.run('updateDriverProgress', () =>
      this.updateDriverProgress(driver_id)
    )
  }

  private async updateDriverProgress(driver_id: string) {
    const activeMissions = (await this.repository.getAll({
      limit: 100,
      filters: { is_active: true }
    })).data
    console.info(
      `Updating progress for driver ${driver_id}. Found ${activeMissions.length} active missions.`
    )

    for (const mission of activeMissions) {
      await this.processMissionProgress(driver_id, mission)
    }
  }

  /**
   * Recalcula do zero — consulta as corridas concluídas do motorista e
   * deriva a contagem, em vez de incrementar. É o que torna a duplicação
   * com o trigger do servidor (`onRideUpdated`) inofensiva: correr duas
   * vezes dá o mesmo resultado. Não mudar isto.
   */
  private async processMissionProgress(
    driver_id: string,
    mission: MissionEntity
  ) {
    console.log(`[processMissionProgress] Starting for mission ${mission.id}`)
    let progress = await this.progressRepository.getProgress(
      driver_id,
      mission.id
    )

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
        id: `${driver_id}_${mission.id}`,
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
      let rides: { data: RideEntity[] } = { data: [] }
      try {
        rides = await this.rideRepository.getAll({
          limit: 1000,
          filters: {
            'driver.id': driver_id,
            status: 'completed'
          } as Partial<RideEntity>
        })
      } catch (error) {
        console.error(`[processMissionProgress] Error fetching rides:`, error)
        return
      }

      const newRidesInCycle = rides.data.filter(ride => {
        let completedAt: any = ride.completed_at || ride.created_at
        if (completedAt && completedAt.toDate) {
          completedAt = completedAt.toDate()
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
      await this.progressRepository.updateProgress(progress)
      console.log(`[processMissionProgress] Progress updated successfully.`)
    } catch (e) {
      console.error(`[processMissionProgress] Failed to update progress:`, e)
      throw e
    }
  }

  /**
   * Paga o bónus no servidor, numa transacção idempotente.
   * `paid: false` significa que a missão já estava paga — não é erro.
   *
   * NÃO passa pelo `run()`: o `toAppError` substituiria a mensagem da API
   * por uma genérica, e o admin deixaria de saber o que falhou.
   */
  executePayMissionProgress(
    driverId: string,
    missionId: string,
    typePaid: 'cash' | 'wallet'
  ): Promise<{ paid: boolean; balance: number | null }> {
    return ApiRepository.adminMoney.payMissionBonus({
      driver_id: driverId,
      mission_id: missionId,
      type_paid: typePaid
    })
  }
}

export const missionUseCase = new MissionUseCase()
