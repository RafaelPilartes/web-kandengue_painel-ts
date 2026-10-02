import { AppModal } from '@/components/modal/AppModal'
// src/components/modals/ModalViewTopupRequest.tsx
// Lib
import { ExternalLink, Calendar, Clock, User, Wallet } from 'lucide-react'

// Style

// Types
import type { modalViewType } from '@/types/modal'

// Interfaces
import { formatMoney } from '@/utils/number'
import {
  getRequestStatusLabel,
  getWalletTopupMethodTypeLabel
} from '@/utils/gettersLabels'
import { formatDateTimeFromFirestore } from '@/utils/date'
import type { WalletTopupRequestInterface } from '@/interfaces/IWalletTopupRequest'
import type { RequestStatus } from '@/types/enum'
import { useWalletsViewModel } from '@/viewModels/WalletViewModel'
import { useQuery } from '@tanstack/react-query'
import { adminUseCase } from '@/domain/usecases/adminUseCase'
import { firebaseCollections } from '@/constants/firebaseCollections'
import { useEffect, useState } from 'react'
import type { WalletInterface } from '@/interfaces/IWallet'

export function ModalViewTopupRequest({
  modalViewRowIsOpen,
  setModalViewRowIsOpen,
  baseInfo
}: modalViewType<WalletTopupRequestInterface>) {
  const namePageSingular = 'Solicitação'

  const { fetchWalletById } = useWalletsViewModel()

  const [wallet, setWallet] = useState<WalletInterface | null>(null)
  const [isLoadingWallet, setIsLoadingWallet] = useState(true)

  /*
   * `reviewed_by` guarda o ID DO DOCUMENTO do admin (`adm-…`), que é o que a
   * API escreve nas duas rotas de revisão. Este modal lia `reviewed_by.name`
   * e `reviewed_by.email` como se fosse o objecto do admin: numa string
   * ambos dão `undefined` e o campo mostrava sempre "N/A". Compilava porque
   * o `modalViewType<T>` declara `baseInfo: T | any`, e o `any` ganha.
   *
   * Resolve-se o nome por uma leitura de um documento, e não pelo
   * `useAdminsViewModel`, que puxaria a colecção `admins` inteira para
   * mostrar um nome. Não se desnormaliza para o pedido: é escrito pelo
   * servidor e não deve guardar dados que envelhecem.
   */
  const reviewerId: string | null =
    typeof baseInfo?.reviewed_by === 'string' && baseInfo.reviewed_by
      ? baseInfo.reviewed_by
      : null

  const { data: reviewer, isLoading: isLoadingReviewer } = useQuery({
    queryKey: [firebaseCollections.admins.root, 'by-id', reviewerId],
    queryFn: () => adminUseCase.executeGetById(reviewerId as string),
    enabled: modalViewRowIsOpen && !!reviewerId,
    staleTime: 1000 * 60 * 5
  })

  // Sem o documento do admin (apagado, por exemplo) mostra-se o id: é
  // sempre melhor do que "N/A" — ainda dá para o procurar.
  const reviewerLabel = reviewerId
    ? (reviewer?.name ?? reviewer?.email ?? (isLoadingReviewer ? 'A carregar…' : reviewerId))
    : '—'

  // Função para carregar o wallet
  async function loadWallet() {
    try {
      setIsLoadingWallet(true)
      const wallet = await fetchWalletById(baseInfo.wallet_id)

      if (wallet) {
        setWallet(wallet)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoadingWallet(false)
    }
  }

  // Carregar o wallet ao abrir o modal
  useEffect(() => {
    if (modalViewRowIsOpen && baseInfo) {
      loadWallet()
    }
  }, [modalViewRowIsOpen])

  // Função para fechar o modal
  function closeModal() {
    setModalViewRowIsOpen(false)
  }

  // Obter cor do status
  const getStatusColor = (status: RequestStatus) => {
    const colors = {
      pending:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      approved:
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return colors[status] || colors.pending
  }

  return (
    <AppModal
      variant="drawer"
      size="md"
      isOpen={modalViewRowIsOpen}
      onClose={closeModal}
      title={`Detalhes da ${namePageSingular}`}
    >
          {/* Content (Details) */}
          <div className="w-full p-6 space-y-6">
            {/* Solicitante */}
            <div className="grid grid-cols-1">
              <label className="block text-sm font-medium text-gray-400">
                Solicitante
              </label>
              {isLoadingWallet ? (
                <div className="w-full flex justify-start items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-200" />
                </div>
              ) : wallet?.user ? (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex flex-row justify-start items-center gap-2">
                    <div className="relative w-9 h-9 overflow-hidden">
                      <img
                        className="w-full h-full object-cover rounded-full"
                        src={wallet?.user.photo || '/default-avatar.png'}
                        alt={wallet?.user.name}
                      />
                    </div>
                    <div className="flex flex-col justify-center items-start">
                      <span className="text-dark dark:text-light font-semibold text-sm">
                        {wallet?.user.name}
                      </span>
                      <span className="text-xs dark:text-light">
                        {wallet?.user.email}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <p className="text-light font-mono">{'N/A'}</p>
                </div>
              )}
            </div>

            {/* ID e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  ID da Solicitação
                </label>
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-gray-400" />
                  <p className="text-light font-mono">
                    {baseInfo?.id || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Status
                </label>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    baseInfo?.status || 'pending'
                  )}`}
                >
                  {getRequestStatusLabel(baseInfo?.status || 'pending')}
                </div>
              </div>
            </div>

            {/* Valor e Método */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Valor
                </label>
                <p className="text-2xl font-bold text-green-500">
                  {baseInfo?.amount ? formatMoney(baseInfo.amount) : 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Método de Pagamento
                </label>
                <p className="text-light">
                  {baseInfo?.method
                    ? getWalletTopupMethodTypeLabel(baseInfo.method)
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Informações da Carteira */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                ID da Carteira
              </label>
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-gray-400" />
                <p className="text-light font-mono">
                  {baseInfo?.wallet_id || 'N/A'}
                </p>
              </div>
            </div>

            {/* Comprovativo */}
            {baseInfo?.proof_url && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Comprovativo
                </label>
                <div className="flex flex-col items-start gap-4">
                  <div className="relative w-48 h-60 border border-gray-600 rounded-lg overflow-hidden">
                    <img
                      src={baseInfo.proof_url}
                      alt="Comprovativo de pagamento"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a
                    href={baseInfo.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400"
                  >
                    <ExternalLink size={16} />
                    Ver em tamanho real
                  </a>
                </div>
              </div>
            )}

            {/* Informações de Revisão */}
            {(baseInfo?.status === 'approved' ||
              baseInfo?.status === 'rejected') &&
              baseInfo?.reviewed_by && (
                <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg">
                  <h4 className="text-lg font-medium text-light">
                    Informações de Revisão
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">
                        Revisado por
                      </label>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <p className="text-light">{reviewerLabel}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-400">
                        Data da Revisão
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <p className="text-light">
                          {
                            formatDateTimeFromFirestore(
                              baseInfo.updated_at as any
                            ).date
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Motivo da Rejeição */}
                  {baseInfo.status === 'rejected' &&
                    baseInfo.rejected_reason && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">
                          Motivo da Rejeição
                        </label>
                        <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                          <p className="text-light">
                            {baseInfo.rejected_reason}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              )}

            {/* Datas de Criação e Atualização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-600">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    Criado em
                  </div>
                </label>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <p className="text-light">
                    {baseInfo?.created_at
                      ? formatDateTimeFromFirestore(baseInfo.created_at as any)
                          .date
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    Atualizado em
                  </div>
                </label>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <p className="text-light">
                    {baseInfo?.updated_at
                      ? formatDateTimeFromFirestore(baseInfo.updated_at as any)
                          .date
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full flex justify-end border-t border-gray-600">
            <button
              type="button"
              onClick={closeModal}
              className="flex items-center justify-center gap-2 text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-50 transition-colors duration-200"
            >
              Fechar
            </button>
          </div>
    </AppModal>
  )
}
