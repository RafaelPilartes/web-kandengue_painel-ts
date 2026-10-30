import { Button } from '@/components/ui/button'
import {
  ADMIN_ACCESS_LEVEL_LABELS,
  ADMIN_ACCESS_LEVELS
} from '@rafaelpilartes/kandengue-shared-v4/constants'
import { useAdminStore } from '@/stores/userStore'
import {
  useAdminDirectory,
  useDepartments,
  useSetAdminAccess
} from '@/viewModels/AccessViewModel'
import { AppModal } from '@/components/modal/AppModal'
import { useState, useEffect } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useFileUploadViewModel } from '@/viewModels/FileUploadViewModel'
import { useAdminsViewModel } from '@/viewModels/AdminViewModel'
import { statusOptions } from '@/data/selectOption'

import { CustomInput } from '@/components/input/InputLabel'
import { SelectCustomZod } from '@/components/selects/SelectCustomZod'

import type { modalEditType } from '@/types/modal'
import type { AdminInterface } from '@/interfaces/IAdmin'
import { showToast } from '@/utils/toasts'
import { validationFileImage } from '@/utils/file'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'

// Schema para edição (sem senha)
const accessLevelOptions = ADMIN_ACCESS_LEVELS.map(level => ({
  value: level,
  label: ADMIN_ACCESS_LEVEL_LABELS[level]
}))

const formSchema = z.object({
  name: z.string().min(3, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(3, 'Telefone obrigatório'),
  status: z.enum(['active', 'inactive', 'pending'], {
    error: () => ({ message: "Selecione 'Ativo', 'Inativo' ou 'Pendente'" })
  }),
  department_id: z.string().optional(),
  access_level: z.enum(['direction', 'manager', 'member']).optional()
})
type formType = z.infer<typeof formSchema>

export function ModalEditAdmin({
  modalEditRowIsOpen,
  setModalEditRowIsOpen,
  baseInfo
}: modalEditType<AdminInterface>) {
  const { updateAdmin } = useAdminsViewModel()
  const { uploadSimple, isUploading, uploadError } = useFileUploadViewModel()

  const { departments } = useDepartments()
  const { byId: accessById } = useAdminDirectory()
  const setAccess = useSetAdminAccess()
  const current = accessById.get(baseInfo.id as string)
  // The API refuses changing one's own access; say so instead of failing on save.
  const isSelf = useAdminStore(s => s.currentAdminData?.id) === baseInfo.id
  const departmentOptions = departments
    .filter(d => d.active || d.id === current?.department_id)
    .map(d => ({ value: d.id, label: d.name }))

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
      status: (baseInfo?.status as any) || 'active',
      department_id: current?.department_id ?? undefined,
      access_level: current?.access_level ?? undefined
    }
  })

  useEffect(() => {
    if (baseInfo) {
      reset({
        name: baseInfo.name,
        email: baseInfo.email,
        phone: baseInfo.phone,
        status: baseInfo.status as any,
        department_id: current?.department_id ?? undefined,
        access_level: current?.access_level ?? undefined
      })
      setImagePreview(baseInfo.photo || '')
    }
  }, [baseInfo, current, reset])

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

      const { department_id, access_level, ...profile } = dataForm
      const dataToUpdate: Partial<AdminInterface> = {
        ...baseInfo,
        ...profile,
        photo: imageUploaded
      }

      delete (dataToUpdate as any).email

      await updateAdmin.mutateAsync({
        id: baseInfo.id as string,
        admin: dataToUpdate
      })

      const accessChanged =
        department_id !== (current?.department_id ?? undefined) ||
        access_level !== (current?.access_level ?? undefined)
      if (!isSelf && accessChanged) {
        if (!department_id || !access_level) {
          showToast('error', 'Escolha o departamento e o nível de acesso.')
          return
        }
        // Through the API, audited there.
        await setAccess.mutateAsync({
          adminId: baseInfo.id as string,
          department_id,
          access_level
        })
      }

      if (updateAdmin.isError) {
        showToast('error', 'Erro ao actualizar o administrador')
      } else {
        showToast('success', 'Administrador actualizado com sucesso!')
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
          <Button type="submit" form="admin-edit" loading={isUploading || updateAdmin.isPending || setAccess.isPending}>
            Guardar
          </Button>
        </>
      }
      title={`Editar ${namePageSingular}`}
    >
          <form
            id="admin-edit"
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

            <div className="w-full grid gap-6 md:grid-cols-2">
              <SelectCustomZod
                name="department_id"
                label="Departamento"
                control={control}
                error={errors.department_id}
                options={departmentOptions}
                isDisabled={isSelf}
                onOptionChange={() => null}
              />
              <SelectCustomZod
                name="access_level"
                label="Nível de acesso"
                control={control}
                error={errors.access_level}
                options={accessLevelOptions}
                isDisabled={isSelf}
                onOptionChange={() => null}
              />
            </div>
            {isSelf && (
              <p className="w-full text-xs text-gray-500 dark:text-gray-400">
                Não pode alterar o seu próprio departamento nem o seu nível. Peça a
                outra pessoa da Direcção.
              </p>
            )}
            </form>
    </AppModal>
  )
}
