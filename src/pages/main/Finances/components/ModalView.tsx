// src/components/modals/ModalViewWallet.tsx
// Lib
import Modal from 'react-modal'
import { X } from 'lucide-react'

// Style
import { customStylesModalCenter } from '@/styles/custom/modals'

// Types
import type { modalViewType } from '@/types/modal'

// Interfaces
import type { WalletInterface } from '@/interfaces/IWallet'
import { formatMoney } from '@/utils/number'
import { getStatusLabel } from '@/utils/gettersLabels'

// ModalViewWallet Component
interface ModalViewWalletProps extends modalViewType<WalletInterface> {}

export function ModalViewWallet({
  modalViewRowIsOpen,
  setModalViewRowIsOpen,
  baseInfo
}: ModalViewWalletProps) {
  const namePageSingular = 'Carteira'

  // Função para fechar o modal
  function closeModal() {
    setModalViewRowIsOpen(false)
  }

  return (
    <Modal
      isOpen={modalViewRowIsOpen}
      onRequestClose={closeModal}
      ariaHideApp={false}
      style={customStylesModalCenter}
      contentLabel="View Wallet Modal"
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full h-auto max-h-[90%] max-w-3xl flex flex-col items-center p-0 rounded-md overflow-y-auto bg-dark overflow-x-hidden scroll-smooth">
          {/* Header */}
          <div className="w-full py-4 px-5 flex justify-between items-center border-b border-gray-600">
            <p className="text-xl font-medium text-light">
              Detalhes da {namePageSingular}
            </p>
            <button
              onClick={closeModal}
              className="p-2 rounded-lg text-light hover:bg-gray-300/20 dark:hover:bg-gray-500/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content (Details) */}
          <div className="w-full p-6">
            {/* Driver */}
            <div className="w-full flex flex-row justify-start items-center gap-4">
              <div className="relative w-14 h-14 overflow-hidden">
                <img
                  className="w-full h-full object-cover rounded-full"
                  src={baseInfo.user?.photo || '/default-avatar.png'}
                  alt={baseInfo.user?.name}
                />
              </div>
              <div className="flex flex-col justify-center items-start text-dark dark:text-light">
                <span className="font-semibold text-lg">
                  {baseInfo.user?.name}
                </span>
                <span className="text-xs">{baseInfo.user?.email}</span>
              </div>
            </div>

            {/* Balance */}
            <div className="w-full mt-4">
              <label className="block text-sm text-gray-300 mb-1">Saldo</label>
              <p className="text-white">{formatMoney(baseInfo.balance)}</p>
            </div>

            {/* Status */}
            <div className="w-full mt-4">
              <label className="block text-sm text-gray-300 mb-1">Status</label>
              <p className="text-white">{getStatusLabel(baseInfo.status)}</p>
            </div>

            {/* Currency */}
            <div className="w-full mt-4">
              <label className="block text-sm text-gray-300 mb-1">Moeda</label>
              <p className="text-white">{baseInfo.currency}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full p-6 flex justify-end border-t border-gray-600">
            <button
              type="submit"
              onClick={closeModal}
              className="flex items-center justify-center gap-2 text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
