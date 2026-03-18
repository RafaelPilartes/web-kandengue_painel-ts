import React, { useEffect } from 'react'
import { useMissionViewModel } from '@/viewModels/MissionViewModel'
import { MissionCard } from '../missions/MissionCard'
import { Spinner } from 'phosphor-react'
import { RefreshCw } from 'lucide-react'
import { showToast } from '@/utils/toasts'

interface DriverProgressTrackerProps {
  driver_id: string
}

export const DriverProgressTracker: React.FC<DriverProgressTrackerProps> = ({
  driver_id
}) => {
  const {
    activeMissions,
    useDriverProgress,
    isLoadingActiveMissions,
    recalculateProgress,
    payMissionProgress
  } = useMissionViewModel()

  const {
    data: progressList = [],
    isLoading: isLoadingProgress,
    refetch: refetchProgress
  } = useDriverProgress(driver_id)

  useEffect(() => {
    console.log('progressList', progressList)
    console.log('activeMissions', activeMissions)
  }, [progressList, activeMissions])

  const handleRecalculate = async () => {
    try {
      await recalculateProgress.mutateAsync(driver_id)
      showToast('success', 'Progresso recalculado com sucesso!')
      refetchProgress()
    } catch (error: any) {
      console.error('Recalculate failure details:', error)
      const msg = error?.message || 'Erro desconhecido'
      showToast('error', `Erro ao recalcular progresso: ${msg}`)
    }
  }

  const handlePay = async (
    driver_id: string,
    mission_id: string,
    type_paid: 'cash' | 'wallet'
  ) => {
    try {
      await payMissionProgress.mutateAsync({
        driver_id,
        mission_id,
        type_paid
      })
      showToast('success', 'Pagamento registrado com sucesso!')
    } catch (error: any) {
      showToast('error', `Erro ao processar pagamento: ${error.message}`)
    }
  }

  if (isLoadingActiveMissions || isLoadingProgress) {
    return (
      <div className="flex justify-center py-10">
        <Spinner size={32} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Progresso das Missões Ativas
        </h4>
        <button
          onClick={handleRecalculate}
          disabled={recalculateProgress.isPending}
          className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={recalculateProgress.isPending ? 'animate-spin' : ''}
          />
          Recalcular Progresso
        </button>
      </div>

      {activeMissions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma missão ativa no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          {activeMissions.map(mission => {
            const progress = progressList.find(p => p.mission_id === mission.id)
            const isPaying = 
              payMissionProgress.isPending && 
              payMissionProgress.variables?.mission_id === mission.id
            
            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                progress={progress?.current_count || 0}
                isCompleted={progress?.is_completed || false}
                isPaid={progress?.is_paid || false}
                isPaying={isPaying}
                typePaid={progress?.type_paid}
                onPay={type =>
                  handlePay(
                    driver_id,
                    mission.id!,
                    type
                  )
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
