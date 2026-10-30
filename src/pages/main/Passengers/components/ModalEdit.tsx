import { Button } from '@/components/ui/button'
import { AppModal } from '@/components/modal/AppModal'
import { useState, useEffect } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useFileUploadViewModel } from '@/viewModels/FileUploadViewModel'
import { useUsersViewModel } from '@/viewModels/UserViewModel'
import { statusOptions } from '@/data/selectOption'

import { CustomInput } from '@/components/input/InputLabel'
import { SelectCustomZod } from '@/components/selects/SelectCustomZod'

import type { modalEditType } from '@/types/modal'
import type { UserInterface } from '@/interfaces/IUser'
import { showToast } from '@/utils/toasts'
import { validationFileImage } from '@/utils/file'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'

// Schema para edição (sem senha)
const formSchema = z.object({
  name: z.string().min(3, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(3, 'Telefone obrigatório'),
  status: z.enum(['active', 'inactive', 'pending'], {
    error: () => ({ message: "Selecione 'Ativo', 'Inativo' ou 'Pendente'" })
  })
})
type formType = z.infer<typeof formSchema>

export function ModalEditUser({
  modalEditRowIsOpen,
  setModalEditRowIsOpen,
  baseInfo
}: modalEditType<UserInterface>) {
  const { updateUser } = useUsersViewModel()
  const { uploadSimple, isUploading, uploadError } = useFileUploadViewModel()

  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [imagePreview, setImagePreview] = useState<string>(
    baseInfo?.photo || ''
  )

  const namePageSingular = 'Usuário'

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<formType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: baseInfo?.name || '',
      email: baseInfo?.email || '',
      phone: baseInfo?.phone || '',
      status: (baseInfo?.status as any) || 'active'
    }
  })

  useEffect(() => {
    if (baseInfo) {
      reset({
        name: baseInfo.name,
        email: baseInfo.email,
        phone: baseInfo.phone,
        status: baseInfo.status as any
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

  async function handleUploadPhoto(): Promise<string> {
    if (!selectedFile) return baseInfo?.photo || ''

    try {
      const { url, path } = await uploadSimple(selectedFile, 'imageUser')
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

      const dataToUpdate: Partial<UserInterface> = {
        ...baseInfo,
        ...dataForm,
        photo: imageUploaded
      }

      delete (dataToUpdate as any).email

      await updateUser.mutateAsync({
        id: baseInfo.id as string,
        user: dataToUpdate
      })

      if (updateUser.isError) {
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
    <AppModal
      isOpen={modalEditRowIsOpen}
      onClose={closeModal}
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" form="passenger-edit" loading={isUploading || updateUser.isPending}>
            Guardar
          </Button>
        </>
      }
      title={`Editar ${namePageSingular}`}
    >
          <form
            id="passenger-edit"
            onSubmit={handleSubmit(handleSubmitForm)}
            className="w-full flex flex-col justify-center items-center gap-6"
          >
            {/* Upload Imagem */}
            <div className="w-full flex flex-col items-start justify-start">
              <div className="w-full max-w-[14rem]">
                <label
                  htmlFor="edit-file"
                  className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 transition-colors hover:border-primary-200/60 dark:border-gray-600 dark:bg-baseBgDark/50 dark:hover:border-primary-200/60 relative overflow-hidden"
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
                        <span className="font-semibold">Carregar a foto</span>{' '}
                        {/* or drag and drop */}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG ou JPEG (máx. 6 MB)
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
            </form>
    </AppModal>
  )
}
