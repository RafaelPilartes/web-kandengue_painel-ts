// src/components/modals/ModalCreateWallet.tsx
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

// Components
import { SelectSearchableCustomZod } from '@/components/selects/SelectSearchableCustomZod'

// Style
import { customStylesModalCenter } from '@/styles/custom/modals'

// Types
import type { modalCreateType } from '@/types/modal'
import type { OptionType } from '@/types/option'

// Interfaces
import type { DriverInterface } from '@/interfaces/IDriver'

// Utils
import { showToast } from '@/utils/toasts'
import { ToastContainer } from 'react-toastify'
import { useDriversViewModel } from '@/viewModels/DriverViewModel'
import { mapUserToOptionsJson } from '@/utils/arrays'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'

// Schema de validação
// const requiredStringField = (message = 'Campo obrigatório') => z.string(message)

const formSchema = z.object({
  user: z.custom<DriverInterface>(val => !!val, {
    message: 'Selecione um motorista'
  }),
  balance: z.number('O saldo deve ser numérico'),
  status: z.enum(['active', 'inactive'], {
    error: () => ({ message: 'Selecione uma moeda válida' })
  }),
  currency: z.enum(['AOA', 'USD'], {
    error: () => ({ message: 'Selecione uma moeda válida' })
  })
})

type formType = z.infer<typeof formSchema>

export function ModalCreateWallet({
  // handleUpdateListing,
  modalCreateRowIsOpen,
  setModalCreateRowIsOpen
}: modalCreateType<any>) {
  const { createWallet, fetchAllWalletsByField } = useWalletsViewModel()
  const [isSending, setIsSending] = useState(false)
  const [rowsDriverOption, setRowsDriverOption] = useState<OptionType[]>([])

  // Selected
  const [selectedDriver, setSelectedDriver] = useState<
    DriverInterface | undefined
  >()

  const { drivers, isLoadingDrivers } = useDriversViewModel(
    500,
    undefined,
    undefined,
    {
      status: 'active'
    }
  )

  const namePageSingular = 'Carteira'

  // Form Zod
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<formType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'active',
      currency: 'AOA'
    }
  })

  function closeModal() {
    setModalCreateRowIsOpen(false)
  }

  const handleDriverSelect = (value: string) => {
    if (!value) {
      setSelectedDriver(undefined)
      return
    }

    try {
      const driverObj = JSON.parse(value)
      setValue('user', driverObj)
    } catch (err) {
      console.error('Erro ao parsear option selecionada:', err)
      setSelectedDriver(undefined)
    }
  }

  // Função para enviar formulário
  async function handleSubmitForm(dataForm: formType) {
    setIsSending(true)

    try {
      const responseFetch = await fetchAllWalletsByField(
        'user.email',
        dataForm.user.email
      )

      if (responseFetch?.data[0]) {
        showToast(
          'error',
          'O motorista selecionado já tem uma carteira criada!'
        )
        setIsSending(false)
        return
      }

      const resultSubmit = await createWallet.mutateAsync({
        user: dataForm.user,
        balance: dataForm.balance,
        status: dataForm.status,
        currency: dataForm.currency
      })

      if (!resultSubmit?.id) {
        showToast('error', 'Houve algum erro durante a criação da carteira')
        setIsSending(false)
      } else {
        showToast('success', 'Carteira criada com sucesso!')
        setTimeout(() => {
          setIsSending(false)
          closeModal()
        }, 2000)
      }
    } catch (error) {
      const message = mapFirebaseError(error)

      showToast('error', String(message))
      setIsSending(false)
    }
  }

  // Buscar motoristas
  async function fetchDriverData() {
    if (drivers.length >= 1) {
      const arrayData = drivers
      const dataOptions = mapUserToOptionsJson(arrayData)
      setRowsDriverOption(dataOptions)
    }
  }

  useEffect(() => {
    fetchDriverData()
  }, [drivers])

  return (
    <Modal
      isOpen={modalCreateRowIsOpen}
      onRequestClose={closeModal}
      ariaHideApp={false}
      style={customStylesModalCenter}
      contentLabel="Create Wallet Modal"
    >
      <div className="w-full h-full flex items-center justify-center ">
        <ToastContainer />

        <div className="w-full h-auto max-h-[90%] max-w-3xl flex flex-col items-center p-0 rounded-md overflow-y-auto bg-dark overflow-x-hidden scroll-smooth">
          {/* Header */}
          <div className="w-full py-4 px-5 flex justify-between items-center border-b border-gray-600">
            <p className="text-xl font-medium text-dark dark:text-light">
              Criar {namePageSingular}
            </p>
            <button
              onClick={closeModal}
              className="p-2 rounded-lg text-dark dark:text-light hover:bg-gray-300/20 dark:hover:bg-gray-500/20"
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
            {isLoadingDrivers ? (
              <div className="w-full flex items-center gap-4">
                <span className="text-sm text-light">Buscando usuários...</span>
                <BeatLoader color="white" size={10} />
              </div>
            ) : (
              <SelectSearchableCustomZod
                name="user_id"
                label="Motorista"
                control={control}
                error={errors.user}
                options={rowsDriverOption}
                defaultValue={
                  selectedDriver ? JSON.stringify(selectedDriver) : ''
                }
                onOptionChange={handleDriverSelect}
              />
            )}

            {/* Saldo */}
            <div className="w-full">
              <label className="block text-sm text-gray-300 mb-1">
                Saldo Inicial
              </label>
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
                className="flex items-center justify-center gap-2 text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 disabled:opacity-50"
              >
                {isSending ? <BeatLoader size={8} color="white" /> : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}
