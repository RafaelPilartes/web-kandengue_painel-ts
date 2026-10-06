import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { missionUseCase } from '@/domain/usecases/missionUseCase'
import { MissionEntity } from '@/core/entities/Mission'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { withAudit } from '@/observability/audit'

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
    queryFn: () =>
      missionUseCase.executeGetAllMissions().then(res => res.data)
  })

  // Fetch active missions
  const { data: activeMissions = [], isLoading: isLoadingActiveMissions } =
    useQuery({
      queryKey: [firebaseCollections.missions.root, 'active'],
      queryFn: () =>
        missionUseCase.executeGetActiveMissions().then(res => res.data)
    })

  // Create Mission
  const createMission = useMutation({
    mutationFn: (mission: Omit<MissionEntity, 'id'>) =>
      withAudit(() => missionUseCase.executeCreateMission(mission), {
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
      const previous_data = await missionUseCase
        .executeGetById(id)
        .catch(() => null)
      return withAudit(() => missionUseCase.executeUpdateMission(id, mission), {
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
      const previous_data = await missionUseCase
        .executeGetById(id)
        .catch(() => null)
      return withAudit(() => missionUseCase.executeDeleteMission(id), {
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
          ? missionUseCase.executeGetDriverProgress(driver_id)
          : Promise.resolve([]),
      enabled: !!driver_id
    })
  }

  // Recalculate Driver Progress
  /**
   * Recalcula no servidor. Sem `withAudit`: a API escreve em `auditLogs`
   * dentro da própria transacção, com o antes de cada progresso alterado —
   * e não deixa registo quando nada muda.
   *
   * Era um recálculo no browser que escrevia o documento inteiro de
   * `missionProgress`, `is_paid` incluído. Esses campos são os que dizem se e
   * quanto de bónus se paga, e as regras passaram a negá-los ao cliente.
   */
  const recalculateProgress = useMutation({
    mutationFn: (driver_id: string) =>
      missionUseCase.executeRecalculateDriverProgress(driver_id),
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
    }) =>
      missionUseCase.executePayMissionProgress(
        driver_id,
        mission_id,
        type_paid
      ),
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
