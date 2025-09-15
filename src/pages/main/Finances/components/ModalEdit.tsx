// src/components/modals/ModalEditWallet.tsx
import { useEffect, useState } from 'react'

// Lib
import Modal from 'react-modal'
import { X } from 'lucide-react'
import { BeatLoader } from 'react-spinners'

// Form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ViewModels
import { useWalletsViewModel } from '@/viewModels/WalletViewModel'

// Style
import { customStylesModalCenter } from '@/styles/custom/modals'

// Types
import type { modalEditType } from '@/types/modal'

// Interfaces
import type { WalletInterface } from '@/interfaces/IWallet'
import type { DriverInterface } from '@/interfaces/IDriver'

// Utils
import { showToast } from '@/utils/toasts'
import { ToastContainer } from 'react-toastify'

// 🔹 Schema de validação
const formSchema = z.object({
  user: z.custom<DriverInterface>(val => !!val, {
    message: 'Selecione um motorista'
  }),
  balance: z.number('O saldo deve ser numérico'),
  status: z.enum(['active', 'inactive', 'pending'], {
    error: () => ({ message: 'Selecione um status válido' })
  }),
  currency: z.enum(['AOA', 'USD'], {
    error: () => ({ message: 'Selecione uma moeda válida' })
  })
})

type formType = z.infer<typeof formSchema>

interface ModalEditWalletProps extends modalEditType<WalletInterface> {}

export function ModalEditWallet({
  modalEditRowIsOpen,
  setModalEditRowIsOpen,
  baseInfo
}: ModalEditWalletProps) {
  const { updateWallet } = useWalletsViewModel()
  const [isSending, setIsSending] = useState(false)

  const namePageSingular = 'Carteira'

  // Form Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<formType>({
    resolver: zodResolver(formSchema)
  })

  function closeModal() {
    setModalEditRowIsOpen(false)
  }

  // 🔹 Preencher dados ao abrir modal
  useEffect(() => {
    if (baseInfo) {
      reset({
        user: baseInfo.user,
        balance: baseInfo.balance,
        status: baseInfo.status,
        currency: baseInfo.currency
      })
    }
  }, [baseInfo, reset])

  // 🔹 Função para enviar formulário
  async function handleSubmitForm(dataForm: formType) {
    if (!baseInfo?.id) return
    setIsSending(true)

    try {
      const resultSubmit = await updateWallet.mutateAsync({
        id: baseInfo.id,
        wallet: {
          balance: dataForm.balance,
          status: dataForm.status,
          currency: dataForm.currency
        }
      })

      console.log('resultSubmit =>', resultSubmit)

      if (!resultSubmit?.id) {
        showToast('error', 'Erro ao atualizar a carteira')
        setIsSending(false)
      } else {
        showToast('success', 'Carteira atualizada com sucesso!')
        setTimeout(() => {
          setIsSending(false)
          closeModal()
        }, 2000)
      }
    } catch (error) {
      showToast('error', String(error))
      setIsSending(false)
    }
  }

  return (
    <Modal
      isOpen={modalEditRowIsOpen}
      onRequestClose={closeModal}
      ariaHideApp={false}
      style={customStylesModalCenter}
      contentLabel="Edit Wallet Modal"
    >
      <div className="w-full h-full flex items-center justify-center ">
        <ToastContainer />

        <div className="w-full h-auto max-h-[90%] max-w-3xl flex flex-col items-center p-0 rounded-md overflow-y-auto bg-dark overflow-x-hidden scroll-smooth">
          {/* Header */}
          <div className="w-full py-4 px-5 flex justify-between items-center border-b border-gray-600">
            <p className="text-xl font-medium text-light">
              Editar {namePageSingular}
            </p>
            <button
              onClick={closeModal}
              className="p-2 rounded-lg text-light hover:bg-gray-300/20 dark:hover:bg-gray-500/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleSubmitForm)}
            className="w-full p-6 flex flex-col justify-center items-center gap-6"
          >
            {/* Usuário (Motorista) */}
            <div className="w-full flex flex-row justify-start items-center gap-2">
              <div className="relative w-14 h-1w-14 overflow-hidden">
                <img
                  className="w-full h-full object-cover rounded-full"
                  src={baseInfo.user.photo || '/default-avatar.png'}
                  alt={baseInfo.user.name}
                />
              </div>
              <div className="flex flex-col justify-center items-start text-dark dark:text-light">
                <span className="font-semibold text-lg">
                  {baseInfo.user.name}
                </span>
                <span className="text-xs">{baseInfo.user.email}</span>
              </div>
            </div>

            {/* Saldo */}
            <div className="w-full">
              <label className="block text-sm text-gray-300 mb-1">Saldo</label>
              <input
                type="number"
                step="0.01"
                {...register('balance', { valueAsNumber: true })}
                className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
              />
              {errors.balance && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.balance.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="w-full">
              <label className="block text-sm text-gray-300 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
              >
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
              </select>
              {errors.status && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Moeda */}
            <div className="w-full">
              <label className="block text-sm text-gray-300 mb-1">Moeda</label>
              <select
                {...register('currency')}
                className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700"
              >
                <option value="AOA">AOA</option>
                <option value="USD">USD</option>
              </select>
              {errors.currency && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.currency.message}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="w-full pt-4 flex justify-end border-t border-gray-600">
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center justify-center gap-2 text-white bg-green-700 hover:bg-green-800 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-50"
              >
                {isSending ? (
                  <BeatLoader size={8} color="white" />
                ) : (
                  'Salvar alterações'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}
