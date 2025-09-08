import { useEffect, useState } from 'react'
import { BeatLoader } from 'react-spinners'

// Lib
import Modal from 'react-modal'
import { ToastContainer } from 'react-toastify'
// Icon
import { X } from 'lucide-react'
// Form
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Services
import AdminViewModel from '../../../../../services/ViewModel/AdminViewModel'
// Interfaces
import type { AdminInterface } from '../../../../../interfaces/IAdmin'
// Type
import type { modalEditeType } from '../../../../../types/modal'
// Data
import { adminRoleOptions } from '../../../../../data/selectOption'
// Utils
import { showToast } from '../../../../../utils/toasts'

// Component
import { SelectCustomZod } from '../../../../../components/selects/SelectCustomZod'

// Style
import { customStylesModalCenter } from '../../../../../styles/custom/modals'
import { SelectSearchableCustomZod } from '../../../../../components/selects/SelectSearchableCustomZod'
import type { OptionType } from '../../../../../types/option'
import UserViewModel from '../../../../../services/ViewModel/UserViewModel'
import type { UserInterface } from '../../../../../interfaces/IUser'
import { SelectMultiSelectionZod } from '../../../../../components/selects/SelectMultiSelectionZod'
import { getPermissionsByRole } from '../../../../../utils/gettersObjectInMap'
import {
  arrayToCommaString,
  mapCommaStringToOptions
} from '../../../../../utils/arrays'

const requiredStringField = (message = 'Campo obrigatório') =>
  z.string().refine(value => value, {
    message
  })

const formSchema = z.object({
  user_id: requiredStringField(),
  role: z.enum(['superadmin', 'manager', 'finance', 'content', 'support']),
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

export function ModalEditAdmin({
  baseInfo,
  modalEditRowIsOpen,
  handleUpdateListing,
  setModalEditRowIsOpen
}: modalEditeType<AdminInterface>) {
  // Loading
  const [isSending, setIsSending] = useState<boolean>(false)
  const [isGettingUsers, setIsGettingUsers] = useState<boolean>(true)

  // Data
  // User
  const [rowUserData, setRowUserData] = useState<UserInterface[] | null>(null)
  const [rowsUserOption, setRowsUserOption] = useState<OptionType[]>([])

  // Const
  const namePageSingular = 'Administrador'

  const initialValues = {
    user_id: String(baseInfo.user.id),
    role: baseInfo.role,
    permissions: baseInfo.permissions
  }

  // Form Zod
  const {
    control,
    reset,
    // watch,
    setValue,
    handleSubmit,
    formState: { errors }
  } = useForm<formType>({
    defaultValues: initialValues,
    resolver: zodResolver(formSchema)
  })

  const [permissionsOptions, setPermissionsOptions] = useState<OptionType[]>([])

  // Modal
  function closeModal() {
    setModalEditRowIsOpen(false)
  }
  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  // Select
  const handleUserChange = (valueSelected: string) => {
    console.log(`Selected: ${valueSelected}`)
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
    setIsSending(true)

    try {
      const permissionString = arrayToCommaString(dataForm.permissions)

      const dataToSave: AdminInterface = {
        ...dataForm,
        permissions: permissionString
      }

      const resultSubmit = await AdminViewModel.update(
        baseInfo?.id as number,
        dataToSave
      )

      if (resultSubmit.error) {
        showToast('error', resultSubmit.msg)
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
    } finally {
      setIsSending(false)
    }
  }

  function mapUsersToOptions(users: UserInterface[]): OptionType[] {
    return users
      .filter(user => user.id !== undefined)
      .map(user => ({
        value: String(user.id),
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

          setRowUserData(arrayData)
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

  useEffect(() => {
    if (rowUserData) {
      const perms = getPermissionsByRole(baseInfo.role)
      setPermissionsOptions(perms)

      // 🟡 Converter as permissões atuais do admin para o formato que o select entende
      const mappedPermissions = mapCommaStringToOptions(
        baseInfo.permissions,
        perms
      )

      reset({
        user_id: String(baseInfo.user.id),
        role: baseInfo.role,
        permissions: mappedPermissions
      })
    }
  }, [rowUserData, reset])

  return (
    <>
      <Modal
        isOpen={modalEditRowIsOpen}
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
                Editar {namePageSingular}
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
                    label="Usuarios"
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

              {/* <SelectCustomZod
                name="permissions"
                label="Permissões do admin"
                control={control}
                error={errors.permissions}
                options={statusOptions}
                onOptionChange={handleAdminPermissionChange}
              /> */}

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

                  {!isSending && <span>Salvar alterações</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
}
