import { useEffect, useState } from 'react'

// Lib
import Modal from 'react-modal'
import { X } from 'lucide-react'
import { BeatLoader } from 'react-spinners'

// Form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Services
import AdminViewModel from '../../../../../services/ViewModel/AdminViewModel'

// Data
import { adminRoleOptions } from '../../../../../data/selectOption'

// Component
import { SelectCustomZod } from '../../../../../components/selects/SelectCustomZod'

// Style
import { customStylesModalCenter } from '../../../../../styles/custom/modals'

// Types
import type { modalCreateType } from '../../../../../types/modal'

// Interfaces
import type { AdminInterface } from '../../../../../interfaces/IAdmin'

// Utils
import { showToast } from '../../../../../utils/toasts'
import { ToastContainer } from 'react-toastify'
import type { OptionType } from '../../../../../types/option'
import UserViewModel from '../../../../../services/ViewModel/UserViewModel'
import type { UserInterface } from '../../../../../interfaces/IUser'
import { SelectSearchableCustomZod } from '../../../../../components/selects/SelectSearchableCustomZod'
import { SelectMultiSelectionZod } from '../../../../../components/selects/SelectMultiSelectionZod'
import { getPermissionsByRole } from '../../../../../utils/gettersObjectInMap'
import { arrayToCommaString } from '../../../../../utils/arrays'

const requiredStringField = (message = 'Campo obrigatório') =>
  z.string().nonempty(message)

const formSchema = z.object({
  user_id: requiredStringField(),
  role: z.enum(['superadmin', 'manager', 'finance', 'content', 'support'], {
    message: 'Selecione uma função válida para o administrador.'
  }),
  permissions: z
    .array(
      z.object({
        value: z.string(),
        label: z.string()
      })
      // {
      //   required_error: 'Selecione pelo menos uma permissão.',
      //   invalid_type_error: 'Permissões inválidas.'
      // }
    )
    .min(1, 'Selecione pelo menos uma permissão.')
})

type formType = z.infer<typeof formSchema>

export function ModalCreateAdmin({
  handleUpdateListing,
  modalCreateRowIsOpen,
  setModalCreateRowIsOpen
}: modalCreateType<any>) {
  // Loading
  const [isSending, setIsSending] = useState<boolean>(false)
  const [isGettingUsers, setIsGettingUsers] = useState<boolean>(true)

  // Data
  const [rowsUserOption, setRowsUserOption] = useState<OptionType[]>([])

  // Const
  const namePageSingular = 'Administrador'

  // Form Zod
  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm<formType>({
    resolver: zodResolver(formSchema)
  })

  const [permissionsOptions, setPermissionsOptions] = useState<OptionType[]>([])

  // Modal
  function closeModal() {
    setModalCreateRowIsOpen(false)
  }
  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  // Select
  const handleUserChange = (valueSelected: string) => {
    console.log(`Selected user type: ${valueSelected}`)
  }
  const handleAdminRoleChange = (valueSelected: string) => {
    const perms = getPermissionsByRole(valueSelected)
    setValue('permissions', []) // limpa permissões quando muda de role

    setPermissionsOptions(perms)

    console.log(`Selected: ${perms}`)
  }

  const handleAdminPermissionChange = (valueSelected: string[]) => {
    console.log(`Selected: ${valueSelected}`)
  }

  // Function Submit Form
  async function handleSubmitForm(dataForm: any) {
    console.log(dataForm)

    setIsSending(true)

    try {
      const permissionString = arrayToCommaString(dataForm.permissions)

      const dataToSave: AdminInterface = {
        ...dataForm,
        permissions: permissionString
      }

      const resultSubmit = await AdminViewModel.create(dataToSave)

      if (resultSubmit.error) {
        showToast('error', resultSubmit.msg)
        setIsSending(false)
      } else {
        showToast('success', resultSubmit.msg)
        setTimeout(() => {
          setIsSending(false)
          closeModal()
        }, 4000)

        handleUpdateListing()
      }
    } catch (error) {
      showToast('error', String(error) as string)
      setIsSending(false)
    }
  }

  function mapUsersToOptions(users: UserInterface[]): OptionType[] {
    return users
      .filter(user => user.id !== undefined)
      .map(user => ({
        value: `${user.entity_code} - ${String(user.id)}`,
        label: user.name
      }))
  }

  async function fetchUserData() {
    setIsGettingUsers(true)
    // Clear
    setRowsUserOption([])

    await UserViewModel.getAllByFields({
      user_type: 'admin'
    })
      .then(async response => {
        if (response.error) {
          console.error('error', response.msg as string)
        } else {
          const arrayData = response.data as UserInterface[]
          const dataOptions = mapUsersToOptions(arrayData)
          setRowsUserOption(dataOptions)
        }
      })
      .catch(err => {
        console.error('Error to get all users => ', err)
      })
      .finally(() => {
        setIsGettingUsers(false)
      })
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  return (
    <>
      <Modal
        isOpen={modalCreateRowIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        ariaHideApp={false}
        style={customStylesModalCenter}
        contentLabel="Example Modal"
      >
        <div className="w-full h-full flex items-center justify-center ">
          <ToastContainer />

          <div className="w-full h-auto max-h-[90%] max-w-3xl flex flex-col items-center p-0  rounded-md overflow-y-auto bg-dark overflow-x-hidden scroll-smooth">
            <div className="w-full py-4 px-5 flex flex-row justify-between items-center border-b-[1px] border-gray-600 ">
              <p className="text-xl font-medium text-light">
                Criar {namePageSingular}
              </p>

              <button
                onClick={closeModal}
                className="py-2 px-2 rounded-lg text-light hover:bg-gray-300/20 dark:hover:bg-gray-500/20 active:bg-gray-300 active:text-dark flex flex-row items-center justify-center gap-4 transition-all duration-300"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(handleSubmitForm)}
              className="w-full p-6 flex flex-col justify-center items-center gap-6"
            >
              {isGettingUsers && (
                <>
                  <div className="w-full flex flex-row justify-start items-center gap-4">
                    <span className="text-sm font-medium  text-light">
                      Buscando usuarios!
                    </span>
                    <BeatLoader color="white" size={10} />
                  </div>
                </>
              )}

              {!isGettingUsers && (
                <>
                  <SelectSearchableCustomZod
                    name="user_id"
                    label="Usuario"
                    control={control}
                    error={errors.user_id}
                    options={rowsUserOption}
                    onOptionChange={e => handleUserChange(e as string)}
                  />
                </>
              )}

              <SelectCustomZod
                name="role"
                label="Função de administrador"
                control={control}
                error={errors.role}
                options={adminRoleOptions}
                onOptionChange={handleAdminRoleChange}
              />

              <SelectMultiSelectionZod
                name="permissions"
                label="Permissões do Administrador"
                control={control}
                error={errors.permissions}
                options={permissionsOptions}
                defaultValue={[]} // opcional
                onOptionChange={handleAdminPermissionChange}
              />

              <div className="w-full pt-4 flex flex-row justify-between items-center border-t-[1px] border-gray-600 ">
                <button
                  type="submit"
                  disabled={isSending}
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {isSending && (
                    <>
                      <BeatLoader color="white" size={10} />
                    </>
                  )}

                  {!isSending && <span>Criar</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
}
