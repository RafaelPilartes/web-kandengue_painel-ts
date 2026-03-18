import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MissionService } from '@/services/mission.service'
import { MissionEntity } from '@/core/entities/Mission'
import { firebaseCollections } from '@/constants/firebaseCollections'

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
      missionService.createMission(mission),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.missions.root]
      })
    }
  })

  // Update Mission
  const updateMission = useMutation({
    mutationFn: ({
      id,
      mission
    }: {
      id: string
      mission: Partial<MissionEntity>
    }) => missionService.updateMission(id, mission),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.missions.root]
      })
    }
  })

  // Delete Mission
  const deleteMission = useMutation({
    mutationFn: (id: string) => missionService.deleteMission(id),
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
      missionService.updateDriverProgress(driver_id),
    onSuccess: (_, driver_id) => {
      queryClient.invalidateQueries({
        queryKey: [firebaseCollections.missionProgress.root, driver_id]
      })
    }
  })

  // Pay Mission Progress
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
