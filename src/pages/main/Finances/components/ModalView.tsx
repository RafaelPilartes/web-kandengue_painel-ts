// Lib
import { AppModal } from '@/components/modal/AppModal'

// Types
import type { modalViewType } from '@/types/modal'

// Interfaces
import type { WalletInterface } from '@/interfaces/IWallet'
import { formatMoney } from '@/utils/number'
import { getStatusLabel } from '@/utils/gettersLabels'

interface ModalViewWalletProps extends modalViewType<WalletInterface> {}

export function ModalViewWallet({
  modalViewRowIsOpen,
  setModalViewRowIsOpen,
  baseInfo
}: ModalViewWalletProps) {
  function closeModal() {
    setModalViewRowIsOpen(false)
  }

  return (
    <AppModal
      variant="drawer"
      size="md"
      isOpen={modalViewRowIsOpen}
      onClose={closeModal}
      title="Detalhes da carteira"
      footer={
        <button
          type="button"
          onClick={closeModal}
          className="rounded-lg bg-primary-200 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-300"
        >
          Fechar
        </button>
      }
    >
      <div className="flex flex-row items-center justify-start gap-4">
        <img
          className="h-14 w-14 shrink-0 rounded-full object-cover"
          src={baseInfo.user?.photo || '/default-avatar.png'}
          alt=""
        />
        <div className="flex min-w-0 flex-col text-dark dark:text-light">
          <span className="truncate text-lg font-semibold">
            {baseInfo.user?.name}
          </span>
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
            {baseInfo.user?.email}
          </span>
        </div>
      </div>

      {/*
        Era uma pilha de `<label>` sem controlo associado. Um par
        termo/valor é `<dl>` — e aí o leitor de ecrã liga os dois.
      */}
      <dl className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <dt className="mb-1 text-sm text-gray-500 dark:text-gray-400">Saldo</dt>
          <dd className="text-dark dark:text-light">
            {formatMoney(baseInfo.balance)}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-sm text-gray-500 dark:text-gray-400">Estado</dt>
          <dd className="text-dark dark:text-light">
            {getStatusLabel(baseInfo.status)}
          </dd>
        </div>
        <div>
          <dt className="mb-1 text-sm text-gray-500 dark:text-gray-400">Moeda</dt>
          <dd className="text-dark dark:text-light">{baseInfo.currency}</dd>
        </div>
      </dl>
    </AppModal>
  )
}
