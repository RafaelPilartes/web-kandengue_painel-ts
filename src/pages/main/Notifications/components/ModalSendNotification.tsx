// src/components/modals/ModalSendNotification.tsx
import { useEffect, useState } from 'react'
import { IoCloseOutline } from 'react-icons/io5'
import Modal from 'react-modal'

import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { SelectCustom } from '@/components/selects/SelectCustom'
import type { NotificationCategory, NotificationType } from '@/types/enum'
import { InputLabelSimple } from '@/components/input/InputLabelSimple'
import { TextAreaLabelSimple } from '@/components/input/TextAreaLabelSimple'
import { customStylesModalCenter } from '@/styles/custom/modals'
import { ToastContainer } from 'react-toastify'
import {
  notificationTypeOptions,
  notificationCategoryOptions
} from '@/data/selectOption'
import { useUsersViewModel } from '@/viewModels/UserViewModel'
import { useDriversViewModel } from '@/viewModels/DriverViewModel'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'
import type { OptionType } from '@/types/option'
import type { UserInterface } from '@/interfaces/IUser'
import { mapUserToOptionsJson } from '@/utils/arrays'
import { showToast } from '@/utils/toasts' // se existir
import { useNotificationsViewModel } from '@/viewModels/NotificationViewModel'
import type { NotificationInterface } from '@/interfaces/INotification'

interface ModalSendNotificationProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  /** opcional: callback para enviar a notificação (integração com VM/API) */
  // onSend: UseMutationResult<NotificationEntity, Error, Omit<NotificationEntity, "id">, unknown>
}

export function ModalSendNotification({
  isOpen,
  setIsOpen
}: ModalSendNotificationProps) {
  const { users, isLoadingUsers } = useUsersViewModel(5000)
  const { drivers, isLoadingDrivers } = useDriversViewModel(5000)
  const { admins, isLoadingAdmins } = useAdminsViewModel(5000)

  const [title, setTitle] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [type, setType] = useState<NotificationType>('ride')
  const [category, setCategory] = useState<NotificationCategory>('all')
  const [specificUser, setSpecificUser] = useState<boolean>(false)

  // Selected
  const [selectedUser, setSelectedUser] = useState<UserInterface | undefined>()

  // Options
  const [rowsCategoryOption, setRowsCategoryOption] = useState<OptionType[]>([])

  const { createNotification } = useNotificationsViewModel()

  // Fecha modal e limpa estado
  const handleCloseModal = () => {
    setIsOpen(false)
    setTitle('')
    setMessage('')
    setType('ride')
    setCategory('all')
    setSpecificUser(false)
    setSelectedUser(undefined)
    setRowsCategoryOption([])
  }

  // Toggle specific user: se categoria é 'all', bloquear ativação
  const handleSpecificUserChange = (value: boolean) => {
    if (category == 'all') {
      // não permite escolher usuário específico quando category === 'all'
      showToast?.(
        'error',
        'Escolha uma categoria específica antes de selecionar um usuário.'
      )
      return
    }
    setSpecificUser(value)
    if (!value) {
      setSelectedUser(undefined)
      setRowsCategoryOption([])
    }
  }

  // Quando o Select retorna um value (string JSON), converte para objeto
  const handleUserSelect = (value: string) => {
    if (!value) {
      setSelectedUser(undefined)
      return
    }

    try {
      const obj = JSON.parse(value)
      setSelectedUser(obj)
    } catch (err) {
      console.error('Erro ao parsear option selecionada:', err)
      setSelectedUser(undefined)
    }
  }

  // Envio
  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      showToast?.('error', 'Preencha título e mensagem.')
      return
    }
    if (specificUser && !selectedUser) {
      showToast?.('error', 'Selecione um usuário específico.')
      return
    }
    if (category === 'all' && specificUser) {
      showToast?.(
        'error',
        'Não é possível selecionar usuário quando a categoria é "Todos".'
      )
      return
    }

    const payload: Omit<NotificationInterface, 'id'> = {
      title: title.trim(),
      message: message.trim(),
      type,
      category,
      specific_user: specificUser,
      user: specificUser ? selectedUser : undefined
    }

    console.log('payload =>', payload)

    try {
      await createNotification.mutateAsync(payload)

      showToast?.('success', 'Notificação enviada com sucesso.')

      // fecha modal após envio
      handleCloseModal()
    } catch (err) {
      console.error('Erro ao enviar notificação:', err)
      showToast?.('error', 'Erro ao enviar notificação.')
    }
  }

  // mostra estado de carregamento dos usuários para o select
  const isLoadingAny = isLoadingUsers || isLoadingDrivers || isLoadingAdmins

  // recalcula opções sempre que category / specificUser / lists mudam
  useEffect(() => {
    if (!specificUser) {
      setRowsCategoryOption([])
      setSelectedUser(undefined)
      return
    }

    if (category === 'all') {
      setSpecificUser(false)
    }

    // sempre limpar user selecionado ao trocar categoria
    setSelectedUser(undefined)

    switch (category) {
      case 'admin':
        setRowsCategoryOption(mapUserToOptionsJson(admins) || [])
        break
      case 'passenger':
        setRowsCategoryOption(mapUserToOptionsJson(users) || [])
        break
      case 'driver':
        setRowsCategoryOption(mapUserToOptionsJson(drivers) || [])
        break
      default:
        // 'all' ou desconhecido -> limpa
        setRowsCategoryOption([])
        setSelectedUser(undefined)
        break
    }
  }, [category, specificUser])

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleCloseModal}
      ariaHideApp={false}
      style={customStylesModalCenter}
      contentLabel="Send notification Modal"
    >
      <div className="w-full h-full flex items-center justify-center ">
        <ToastContainer />

        <div className="w-full h-auto max-h-[90%] max-w-3xl flex flex-col items-center p-0 rounded-md overflow-y-auto bg-dark overflow-x-hidden scroll-smooth">
          {/* Header */}
          <div className="w-full py-4 px-5 flex justify-between items-center border-b border-gray-600">
            <h2 className="text-xl font-bold text-dark dark:text-light">
              Enviar Notificação
            </h2>
            <button
              onClick={handleCloseModal}
              className="p-2 rounded-lg text-dark dark:text-light hover:bg-gray-300/20 dark:hover:bg-gray-500/20"
            >
              <IoCloseOutline size={24} />
            </button>
          </div>

          <div className="w-full p-6 flex flex-col justify-center items-center gap-6">
            {/* Título */}
            <div className="w-full">
              <InputLabelSimple
                htmlFor="title"
                label="Título"
                value={title}
                onChange={v => setTitle(v)}
                type="text"
                placeholder="Digite o título da notificação"
                required
              />
            </div>

            {/* Mensagem */}
            <div className="w-full">
              <TextAreaLabelSimple
                htmlFor="message"
                label="Mensagem"
                value={message}
                onChange={v => setMessage(v)}
                placeholder="Digite a mensagem da notificação"
              />
            </div>

            <div className="w-full flex flex-row gap-4">
              <SelectCustom
                label="Tipo"
                options={notificationTypeOptions}
                selectedValue={type}
                onChange={val => setType(val as NotificationType)}
              />

              <SelectCustom
                label="Categoria"
                options={notificationCategoryOptions}
                selectedValue={category}
                onChange={val => setCategory(val as NotificationCategory)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="specificUser"
                checked={specificUser}
                onChange={() => {
                  handleSpecificUserChange(!specificUser)
                }}
                className="h-4 w-4"
              />
              <label
                htmlFor="specificUser"
                className="text-dark dark:text-light"
              >
                Enviar para um usuário específico
              </label>
            </div>

            {specificUser && (
              <div className="w-full">
                {isLoadingAny ? (
                  <div>Carregando usuários...</div>
                ) : (
                  <SelectSearchableCustom
                    name="user"
                    label="Selecionar Usuário"
                    defaultValue={
                      selectedUser ? JSON.stringify(selectedUser) : ''
                    }
                    options={rowsCategoryOption}
                    onOptionChange={handleUserSelect}
                  />
                )}
              </div>
            )}

            {/* Botões */}
            <div className="mt-6 flex gap-4 justify-end w-full">
              <button
                className="py-2 px-4 rounded-lg bg-gray-400 text-white hover:bg-gray-500"
                onClick={handleCloseModal}
              >
                Cancelar
              </button>
              <button
                className="py-2 px-4 rounded-lg bg-primary-200 text-white hover:bg-primary-500 disabled:opacity-60"
                onClick={handleSendNotification}
                disabled={createNotification.isPending}
              >
                {createNotification.isPending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
