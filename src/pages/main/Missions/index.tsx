import React, { useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { useMissionViewModel } from '@/viewModels/MissionViewModel'
import { MissionCard } from '@/components/missions/MissionCard'
import { Plus, Target, Trophy } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { MissionEntity } from '@/core/entities/Mission'
import { showToast } from '@/utils/toasts'
import { ToastContainer } from 'react-toastify'

export function MissionsPage() {
  const { 
    missions, 
    isLoadingMissions, 
    createMission, 
    updateMission, 
    deleteMission 
  } = useMissionViewModel()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMission, setEditingMission] = useState<MissionEntity | null>(null)
  
  const [formData, setFormData] = useState({
    type: 'daily' as 'daily' | 'weekly' | 'monthly',
    target: 10,
    reward: 1000,
    is_active: true
  })

  const itemsBreadcrumbs = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Missões de Produtividade' }
  ]

  const handleOpenModal = (mission?: MissionEntity) => {
    if (mission) {
      setEditingMission(mission)
      setFormData({
        type: mission.type,
        target: mission.target,
        reward: mission.reward,
        is_active: mission.is_active
      })
    } else {
      setEditingMission(null)
      setFormData({
        type: 'daily',
        target: 10,
        reward: 1000,
        is_active: true
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMission(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingMission) {
        await updateMission.mutateAsync({ id: editingMission.id, mission: formData })
        showToast('success', 'Missão atualizada com sucesso!')
      } else {
        await createMission.mutateAsync(formData as any)
        showToast('success', 'Missão criada com sucesso!')
      }
      handleCloseModal()
    } catch (error) {
      showToast('error', 'Erro ao salvar missão')
    }
  }

  const handleToggleStatus = async (mission: MissionEntity) => {
    try {
      await updateMission.mutateAsync({ 
        id: mission.id, 
        mission: { is_active: !mission.is_active } 
      })
      showToast('success', `Missão ${mission.is_active ? 'desativada' : 'ativada'} com sucesso!`)
    } catch (error) {
      showToast('error', 'Erro ao alterar status da missão')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta missão?')) {
      try {
        await deleteMission.mutateAsync(id)
        showToast('success', 'Missão excluída com sucesso!')
      } catch (error) {
        showToast('error', 'Erro ao excluir missão')
      }
    }
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <ToastContainer />
      <Breadcrumbs items={itemsBreadcrumbs} />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Missões</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure metas e bônus para os motoristas</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={20} /> Nova Missão
        </button>
      </div>

      {isLoadingMissions ? (
        <div className="flex justify-center py-20">
          <Spinner size={48} className="animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isAdmin={true}
              onEdit={handleOpenModal}
              onToggle={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
          {missions.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma missão configurada.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Simplificado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {editingMission ? 'Editar Missão' : 'Nova Missão'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Ciclo</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                >
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Meta de Entregas</label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={formData.target}
                    onChange={e => setFormData({ ...formData, target: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                    placeholder="Ex: 15"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor do Bônus (Kz)</label>
                <div className="relative">
                  <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    value={formData.reward}
                    onChange={e => setFormData({ ...formData, reward: Number(e.target.value) })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                    placeholder="Ex: 3000"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Missão Ativa
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMission.isPending || updateMission.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {editingMission ? 'Salvar Alterações' : 'Criar Missão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
