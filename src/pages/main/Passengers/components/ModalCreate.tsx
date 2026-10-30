import { Button } from '@/components/ui/button'
import { AppModal } from '@/components/modal/AppModal'
import { useState } from 'react'

// Lib

// Form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Services
import { useFileUploadViewModel } from '@/viewModels/FileUploadViewModel'
import { useUsersViewModel } from '@/viewModels/UserViewModel'

// Data
import { statusOptions } from '@/data/selectOption'

// Component
import { CustomInput } from '@/components/input/InputLabel'
import { SelectCustomZod } from '@/components/selects/SelectCustomZod'

// Style

// Types
import type { modalCreateType } from '@/types/modal'

// Interfaces
// import type { UserInterface } from '@/interfaces/IUser'

// Utils
import { showToast } from '@/utils/toasts'
import { validationFileImage } from '@/utils/file'
import { useAuthViewModel } from '@/viewModels/AuthViewModel'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'

const requiredStringField = (message = 'Campo obrigatório') =>
  z
    .string(message)
    .min(3, 'É necessário no mínimo 3 caracteres')
    .refine(value => value, {
      message: 'Por favor, preencha este campo'
    })

const formSchema = z.object({
  name: requiredStringField('O nome é obrigatório!'),
  email: z.string('O email é obrigatório!').toLowerCase().trim(),
  phone: requiredStringField(),
  status: z.enum(['active', 'inactive', 'pending'], {
    error: () => ({
      message: "Selecione 'Ativo', 'Inativo' ou 'Pendente' "
    })
  }),
  password: z
    .string('A palavra-passe é obrigatório!')
    .min(6, 'A palavra-passe tem de no mínimo 6 caracteres')
    .trim()
    .refine(value => value, {
      message: 'Por favor, preencha este campo.'
    }),
  confirm_password: z
    .string()
    .min(6, 'A confirmação de palavra-passe deve ter no mínimo 6 caracteres')
})
type formType = z.infer<typeof formSchema>

export function ModalCreateUser({
  modalCreateRowIsOpen,
  setModalCreateRowIsOpen
}: modalCreateType<any>) {
  const { createUser, fetchOneUserByField } = useUsersViewModel()
  const { uploadSimple, isUploading, uploadError } = useFileUploadViewModel()
  const { register, isRegistering, registerError } = useAuthViewModel()

  // Image
  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [imagePreview, setImagePreview] = useState<string>('')

  // Const
  const namePageSingular = 'Usuário'

  // Form Zod
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<formType>({
    resolver: zodResolver(formSchema)
  })

  // Modal
  function closeModal() {
    setModalCreateRowIsOpen(false)
  }

  // Image
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

  // Handle Select
  const handleStatusChange = (valueSelected: string) => {
    if (valueSelected) {
      console.log = () => {}
    }
  }

  // Function Upload Photo
  async function handleUploadPhoto(): Promise<{
    urlFile: string
    pathFile: string
  }> {
    if (!selectedFile) showToast('error', 'Ficheiro não selecionada')

    try {
      const { url, path } = await uploadSimple(
        selectedFile as File,
        'imageUser'
      )

      if (!url || !path) {
        showToast(
          'error',
          uploadError ? uploadError : 'Houve algum erro no upload do ficheiro'
        )
        throw new Error('Erro ao carregar ficheiro: retorno inválido')
      }

      const urlFile = url as string
      const pathFile = path as string

      return {
        urlFile,
        pathFile
      }
    } catch (err) {
      console.error('Erro no upload:', err)
      showToast('error', 'Erro ao carregar ficheiro')
      throw err // mantém consistência de Promise
    }
  }

  // Function Submit Form
  async function handleSubmitForm(dataForm: formType) {
    if (dataForm.password !== dataForm.confirm_password) {
      showToast('error', 'As palavras pass não convidem')
      return
    }

    try {
      const userFounded = await fetchOneUserByField('email', dataForm.email)
      if (userFounded) {
        showToast('error', `Este email email já encontra-se em uso`)
        return
      }

      const proceed = confirm('Não poderá alterar o email, pretende continuar?')
      if (!proceed) {
        return
      }

      await register({
        email: dataForm.email,
        password: dataForm.password
      })

      if (registerError) {
        showToast(
          'error',
          `Não foi possivel efetuar login com esse email e senha ${registerError}`
        )
        return
      }

      let imageUploaded =
        'https://cdn-icons-png.flaticon.com/512/10307/10307911.png'

      // Primeiro, faz o upload da imagem
      if (selectedFile) {
        const resUrl = await handleUploadPhoto()

        const { urlFile } = resUrl

        if (!urlFile) {
          showToast('error', 'Erro ao carregar imagem')
          return
        }

        imageUploaded = urlFile
      }

      const dataToSave: any = {
        ...dataForm,
        photo: imageUploaded
      }

      // remove key from dataToSave
      delete (dataToSave as any).password
      delete (dataToSave as any).confirm_password

      await createUser.mutateAsync(dataToSave)

      if (createUser.isError) {
        showToast('error', 'Erro ao salvar motorista')
      } else {
        showToast('success', 'Motorista criado com sucesso!')
        setTimeout(() => {
          closeModal()
        }, 3000)
      }
    } catch (error) {
      const message = mapFirebaseError(error)
      showToast('error', message)
    }
  }

  return (
    <>
      <AppModal
      isOpen={modalCreateRowIsOpen}
      onClose={closeModal}
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" form="passenger-create" loading={isUploading || createUser.isPending || isRegistering}>
            Guardar
          </Button>
        </>
      }
      title={`Criar ${namePageSingular}`}
    >
            <form
              id="passenger-create"
              onSubmit={handleSubmit(handleSubmitForm)}
              className="w-full flex flex-col justify-center items-center gap-6"
            >
              <div className="w-full flex flex-col items-start justify-start">
                <div className="w-full max-w-[14rem] flex items-start justify-start ">
                  <label
                    htmlFor="dropzone-file"
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
                        className=" w-full h-full object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                        src={imagePreview}
                        alt="Rafael Pilartes"
                      />
                    )}
                    <input
                      id="dropzone-file"
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
                  placeholder="Ex.: rafael@saudeemcasa.com"
                  control={control}
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

              <div className="w-full grid gap-6 md:grid-cols-2">
                <SelectCustomZod
                  name="status"
                  label="Estado da conta"
                  control={control}
                  error={errors.status}
                  options={statusOptions}
                  onOptionChange={handleStatusChange}
                />
              </div>

              <div className="w-full grid gap-6 md:grid-cols-2">
                <CustomInput
                  type="password"
                  htmlFor="password"
                  label="Palavra Pass"
                  placeholder="•••••••••"
                  control={control}
                  error={errors.password}
                />
                <CustomInput
                  type="password"
                  htmlFor="confirm_password"
                  label="Confirme a Palavra Pass"
                  placeholder="•••••••••"
                  control={control}
                  error={errors.confirm_password}
                />
              </div>
            </form>
      </AppModal>
    </>
  )
}
