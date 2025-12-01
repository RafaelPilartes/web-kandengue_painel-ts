import { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { X } from 'lucide-react'
import { BeatLoader } from 'react-spinners'
import { ToastContainer } from 'react-toastify'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useFileUploadViewModel } from '@/viewModels/FileUploadViewModel'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'
import { adminRoleOptions, statusOptions } from '@/data/selectOption'

import { CustomInput } from '@/components/input/InputLabel'
import { SelectCustomZod } from '@/components/selects/SelectCustomZod'
import { customStylesModalCenter } from '@/styles/custom/modals'

import type { modalEditType } from '@/types/modal'
import type { AdminInterface } from '@/interfaces/IAdmin'
import { showToast } from '@/utils/toasts'
import { validationFileImage } from '@/utils/file'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'
import { SelectMultiSelectionZod } from '@/components/selects/SelectMultiSelectionZod'
import type { OptionType } from '@/types/option'
import { getPermissionsByRole } from '@/utils/gettersObjectInMap'

// Schema para edição (sem senha)
const formSchema = z.object({
  name: z.string().min(3, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(3, 'Telefone obrigatório'),
  status: z.enum(['active', 'inactive', 'pending'], {
    error: () => ({ message: "Selecione 'Ativo', 'Inativo' ou 'Pendente'" })
  }),
  role: z.enum(['superadmin', 'manager', 'finance', 'content', 'support'], {
    error: () => ({
      message: 'Selecione uma função válida para o administrador.'
    })
  }),
  permissions: z
    .array(
      z.object({
        value: z.string(),
        label: z.string()
      }),
      {
        error: 'Selecione pelo menos uma permissão.'
      }
    )
    .min(1, 'Selecione pelo menos uma permissão.')
})
type formType = z.infer<typeof formSchema>

export function ModalEditAdmin({
  modalEditRowIsOpen,
  setModalEditRowIsOpen,
  baseInfo
}: modalEditType<AdminInterface>) {
  const { updateAdmin } = useAdminsViewModel()
  const { uploadSimple, isUploading, uploadError } = useFileUploadViewModel()

  const [permissionsOptions, setPermissionsOptions] = useState<OptionType[]>([])

  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [imagePreview, setImagePreview] = useState<string>(
    baseInfo?.photo || ''
  )

  const namePageSingular = 'Usuário'

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<formType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: baseInfo?.name || '',
      email: baseInfo?.email || '',
      phone: baseInfo?.phone || '',
      status: (baseInfo?.status as any) || 'active',
      role: baseInfo.role || '',
      permissions: baseInfo.permissions || []
    }
  })

  useEffect(() => {
    if (baseInfo) {
      reset({
        name: baseInfo.name,
        email: baseInfo.email,
        phone: baseInfo.phone,
        status: baseInfo.status as any,
        role: baseInfo.role,
        permissions: baseInfo.permissions
      })
      setImagePreview(baseInfo.photo || '')
    }
  }, [baseInfo, reset])

  function closeModal() {
    setModalEditRowIsOpen(false)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { error, message } = validationFileImage(file, 6)
    if (error) {
      showToast('error', message)
      return
    }

    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Select
  const handleAdminPermissionChange = (valueSelected: string[]) => {
    console.log(`Selected: ${valueSelected}`)
  }
  const handleAdminRoleChange = (valueSelected: string) => {
    const perms = getPermissionsByRole(valueSelected)
    setValue('permissions', []) // limpa permissões quando muda de role

    setPermissionsOptions(perms)

    console.log(`Selected: ${perms}`)
  }

  async function handleUploadPhoto(): Promise<string> {
    if (!selectedFile) return baseInfo?.photo || ''

    try {
      const { url, path } = await uploadSimple(selectedFile, 'imageAdmin')
      if (!url || !path) {
        showToast('error', uploadError || 'Erro ao carregar ficheiro')
        throw new Error('Upload inválido')
      }
      return url
    } catch (err) {
      console.error('Erro no upload:', err)
      showToast('error', 'Erro ao carregar ficheiro')
      throw err
    }
  }

  async function handleSubmitForm(dataForm: formType) {
    try {
      let imageUploaded = baseInfo?.photo || ''
      if (selectedFile) {
        imageUploaded = await handleUploadPhoto()
      }

      const dataToUpdate: Partial<AdminInterface> = {
        ...baseInfo,
        ...dataForm,
        photo: imageUploaded
      }

      delete (dataToUpdate as any).email

      await updateAdmin.mutateAsync({
        id: baseInfo.id as string,
        admin: dataToUpdate
      })

      if (updateAdmin.isError) {
        showToast('error', 'Erro ao atualizar motorista')
      } else {
        showToast('success', 'Motorista atualizado com sucesso!')
        setTimeout(() => {
          closeModal()
        }, 2000)
      }
    } catch (error) {
      const message = mapFirebaseError(error)
      showToast('error', message)
    }
  }

  return (
    <Modal
      isOpen={modalEditRowIsOpen}
      onRequestClose={closeModal}
      ariaHideApp={false}
      style={customStylesModalCenter}
      contentLabel="Modal Editar"
    >
      <div className="w-full h-full flex items-center justify-center">
        <ToastContainer />

        <div className="w-full h-auto max-h-[90%] max-w-3xl flex flex-col items-center p-0 rounded-md overflow-y-auto bg-dark">
          <div className="w-full py-4 px-5 flex flex-row justify-between items-center border-b border-gray-600">
            <p className="text-xl font-medium text-light">
              Editar {namePageSingular}
            </p>

            <button
              onClick={closeModal}
              className="p-2 rounded-lg text-light hover:bg-gray-300/20"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(handleSubmitForm)}
            className="w-full p-6 flex flex-col justify-center items-center gap-6"
          >
            {/* Upload Imagem */}
            <div className="w-full flex flex-col items-start justify-start">
              <div className="w-full max-w-[14rem]">
                <label
                  htmlFor="edit-file"
                  className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-gray-70 relative overflow-hidden"
                >
                  {!imagePreview && (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 16"
                      >
                        <path
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span>{' '}
                        {/* or drag and drop */}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG or JPEG (MAX. 6Mb)
                      </p>
                    </div>
                  )}
                  {imagePreview && (
                    <img
                      className="w-full h-full object-cover absolute inset-0"
                      src={imagePreview}
                      alt="Preview"
                    />
                  )}
                  <input
                    id="edit-file"
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <CustomInput
              type="text"
              htmlFor="name"
              label="Nome"
              placeholder="Ex.: Rafael"
              control={control}
              error={errors.name}
            />

            <div className="w-full grid gap-6 md:grid-cols-2">
              <CustomInput
                type="email"
                htmlFor="email"
                label="Endereço de email"
                placeholder="Ex.: rafael@email.com"
                control={control}
                isDisabled
                error={errors.email}
              />
              <CustomInput
                type="number"
                htmlFor="phone"
                label="Número de telefone"
                placeholder="Ex.: 923414621"
                control={control}
                error={errors.phone}
              />
            </div>

            <SelectCustomZod
              name="status"
              label="Estado da conta"
              control={control}
              error={errors.status}
              options={statusOptions}
              onOptionChange={() => null}
            />

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

            <div className="w-full pt-4 flex justify-between items-center border-t border-gray-600">
              <button
                type="submit"
                disabled={isUploading || updateAdmin.isPending}
                className="text-white bg-primary-200 hover:bg-primary-300 focus:ring-2 focus:outline-none focus:ring-primary-100 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-primary-200 dark:hover:bg-primary-300 dark:focus:ring-primary-500"
              >
                {isUploading || updateAdmin.isPending ? (
                  <div className="flex items-center gap-2">
                    <BeatLoader color="white" size={10} />
                  </div>
                ) : (
                  <span>Salvar</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  )
}
