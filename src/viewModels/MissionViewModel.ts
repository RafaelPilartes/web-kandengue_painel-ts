import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MissionService } from '@/services/mission.service'
import { MissionEntity } from '@/core/entities/Mission'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { withAudit } from '@/services/audit.service'

const missionService = new MissionService()

export function useMissionViewModel() {
  const queryClient = useQueryClient()

  // Fetch all missions
  const {
    data: missions = [],
    isLoading: isLoadingMissions,
    error: missionsError,
    refetch: refetchMissions
  } = useQuery({
    queryKey: [firebaseCollections.missions.root],
    queryFn: () => missionService.getAllMissions().then(res => res.data)
  })

  // Fetch active missions
  const { data: activeMissions = [], isLoading: isLoadingActiveMissions } =
    useQuery({
      queryKey: [firebaseCollections.missions.root, 'active'],
      queryFn: () => missionService.getActiveMissions().then(res => res.data)
    })

  // Create Mission
  const createMission = useMutation({
    mutationFn: (mission: Omit<MissionEntity, 'id'>) =>
      withAudit(() => missionService.createMission(mission), {
        action: 'create',
        module: 'missions',
        description: `Criou nova missão: ${mission.type}`,
        target_type: 'mission',
        target_label: mission.type,
        new_data: mission
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.missions.root]
      })
    }
  })

  // Update Mission
  const updateMission = useMutation({
    mutationFn: async ({
      id,
      mission
    }: {
      id: string
      mission: Partial<MissionEntity>
    }) => {
      const previous_data = await missionService.getById(id).catch(() => null)
      return withAudit(() => missionService.updateMission(id, mission), {
        action: 'update',
        module: 'missions',
        description: `Atualizou missão - ID: ${id}`,
        target_id: id,
        target_type: 'mission',
        previous_data: previous_data || undefined,
        new_data: mission
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.missions.root]
      })
    }
  })

  // Delete Mission
  const deleteMission = useMutation({
    mutationFn: async (id: string) => {
      const previous_data = await missionService.getById(id).catch(() => null)
      return withAudit(() => missionService.deleteMission(id), {
        action: 'delete',
        module: 'missions',
        description: `Excluiu missão - ID: ${id}`,
        target_id: id,
        target_type: 'mission',
        previous_data: previous_data || undefined,
        severity: 'critical'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.missions.root]
      })
    }
  })

  // Fetch Driver Progress
  const useDriverProgress = (driver_id?: string) => {
    return useQuery({
      queryKey: [firebaseCollections.missionProgress.root, driver_id],
      queryFn: () =>
        driver_id
          ? missionService.getDriverProgress(driver_id)
          : Promise.resolve([]),
      enabled: !!driver_id
    })
  }

  // Recalculate Driver Progress
  const recalculateProgress = useMutation({
    mutationFn: (driver_id: string) =>
      withAudit(() => missionService.updateDriverProgress(driver_id), {
        action: 'update',
        module: 'drivers',
        description: `Recalculou progresso das missões do motorista - ID: ${driver_id}`,
        target_id: driver_id,
        target_type: 'driver'
      }),
    onSuccess: (_, driver_id) => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.missionProgress.root, driver_id]
      })
    }
  })

  // Pay Mission Progress
  /**
   * Paga o bónus numa única chamada ao servidor. Sem `withAudit`: a API
   * escreve em `walletAuditLogs` dentro da própria transacção, e esse registo
   * não pode existir sem o movimento de dinheiro.
   */
  const payMissionProgress = useMutation({
    mutationFn: ({
      driver_id,
      mission_id,
      type_paid
    }: {
      driver_id: string
      mission_id: string
      type_paid: 'cash' | 'wallet'
    }) => missionService.payMissionProgress(driver_id, mission_id, type_paid),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          firebaseCollections.missionProgress.root,
          variables.driver_id
        ]
      })
    }
  })

  return {
    missions,
    activeMissions,
    isLoadingMissions,
    isLoadingActiveMissions,
    missionsError,
    refetchMissions,
    createMission,
    updateMission,
    deleteMission,
    useDriverProgress,
    recalculateProgress,
    payMissionProgress
  }
}
