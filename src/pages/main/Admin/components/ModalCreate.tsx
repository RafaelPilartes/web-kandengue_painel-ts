import { Button } from '@/components/ui/button'
import {
  useCreateAdmin,
  useDepartmentProfiles,
  useDepartments
} from '@/viewModels/AccessViewModel'
import { useAccess } from '@/hooks/useAccess'
import { canAssignProfile } from '@rafaelpilartes/kandengue-shared/functions'
import { AppModal } from '@/components/modal/AppModal'
import { useState } from 'react'

// Lib

// Form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Services
import { useFileUploadViewModel } from '@/viewModels/FileUploadViewModel'
import { useAuthViewModel } from '@/viewModels/AuthViewModel'

// Data
import { statusOptions } from '@/data/selectOption'
import { genderOptions } from './genderOptions'

// Component
import { CustomInput } from '@/components/input/InputLabel'
import { SelectCustomZod } from '@/components/selects/SelectCustomZod'

// Style

// Types
import type { modalCreateType } from '@/types/modal'

// Interfaces
// import type { AdminInterface } from '@/interfaces/IAdmin'

// Utils
import { showToast } from '@/utils/toasts'
import { validationFileImage } from '@/utils/file'
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
  department_id: z
    .string('Escolha o departamento.')
    .min(1, 'Escolha o departamento.'),
  profile_id: z.string('Escolha o perfil.').min(1, 'Escolha o perfil.'),
  // Empty is a real answer: the greeting stays neutral.
  gender: z.enum(['female', 'male']).optional(),
})
type formType = z.infer<typeof formSchema>

export function ModalCreateAdmin({
  modalCreateRowIsOpen,
  setModalCreateRowIsOpen
}: modalCreateType<any>) {
  const createAdmin = useCreateAdmin()
  const { resetPassword } = useAuthViewModel()
  const { uploadSimple, isUploading, uploadError } = useFileUploadViewModel()
  const { departments } = useDepartments()
  const departmentOptions = departments
    .filter(d => d.active)
    .map(d => ({ value: d.id, label: d.name }))

  /*
   * The profile list follows the chosen department: a profile only exists
   * inside one, and the API refuses a profile that belongs to another.
   */
  const [departmentId, setDepartmentId] = useState<string>('')
  const { profiles } = useDepartmentProfiles(departmentId || null)

  /*
   * The panel only HIDES; the API is what refuses. The same guard from the
   * shared library decides both, so the profiles on offer here are exactly
   * the ones the API would accept.
   */
  const { access } = useAccess()
  const profileOptions = profiles
    .filter(p => p.active && canAssignProfile(access, p))
    .map(p => ({ value: p.id, label: p.name }))

  // Image
  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [imagePreview, setImagePreview] = useState<string>('')


  // Const
  const namePageSingular = 'Usuário'

  // Form Zod
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue
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
        'imageAdmin'
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

  /*
   * Creating an admin is one call to the API, and it used to be four steps in
   * the browser. Two of them were broken:
   *
   *   - `createUserWithEmailAndPassword` signs the CURRENT admin out and the
   *     new one in — whoever created an account lost their own session;
   *   - the `admins` document write is denied by `allow write: if false` in
   *     the Firestore rules, so nothing was ever created.
   *
   * The API does the Auth account, the document, the department, the level and
   * the audit line together, and deletes the Auth account again if the
   * document write fails.
   */
  async function handleSubmitForm(dataForm: formType) {
      try {
      let imageUploaded =
        'https://cdn-icons-png.flaticon.com/512/10307/10307911.png'

      if (selectedFile) {
        const { urlFile } = await handleUploadPhoto()
        if (!urlFile) {
          showToast('error', 'Erro ao carregar imagem')
          return
        }
        imageUploaded = urlFile
      }

      await createAdmin.mutateAsync({
        name: dataForm.name,
        email: dataForm.email,
        phone: dataForm.phone,
        status: dataForm.status,
        photo: imageUploaded,
        department_id: dataForm.department_id,
        profile_id: dataForm.profile_id,
        gender: dataForm.gender
      })

      /*
       * O link vai pelo Firebase, directamente para a pessoa. É de propósito
       * que não passa por quem cria a conta: ver o link é poder definir a
       * palavra-passe, e isso era a escalada que isto fecha.
       */
      try {
        await resetPassword(dataForm.email)
        showToast(
          'success',
          'Administrador criado. Foi enviado um email para definir a palavra-passe.'
        )
      } catch {
        showToast(
          'warning',
          'Administrador criado, mas o email para definir a palavra-passe não saiu. Usa "Esqueci-me da palavra-passe" no login com este email.'
        )
      }
      setTimeout(() => {
        closeModal()
      }, 3000)
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
          <Button
            type="submit"
            form="admin-create"
            loading={isUploading || createAdmin.isPending}
          >
            Guardar
          </Button>
        </>
      }
      title={`Criar ${namePageSingular}`}
    >
            <form
              id="admin-create"
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
                <SelectCustomZod
                  name="gender"
                  label="Tratamento na saudação"
                  control={control}
                  error={errors.gender}
                  options={genderOptions}
                  onOptionChange={() => {}}
                />
              </div>

              <div className="w-full grid gap-6 md:grid-cols-2">
                <SelectCustomZod
                  name="department_id"
                  label="Departamento"
                  control={control}
                  error={errors.department_id}
                  options={departmentOptions}
                  onOptionChange={value => {
                    setDepartmentId(value)
                    // The profile that was chosen belongs to the department
                    // that was chosen before: it cannot stay selected.
                    setValue('profile_id', '')
                  }}
                />
                <SelectCustomZod
                  name="profile_id"
                  label="Perfil"
                  control={control}
                  error={errors.profile_id}
                  options={profileOptions}
                  isDisabled={!departmentId}
                  onOptionChange={() => {}}
                />
              </div>

              {/*
                * Sem campos de palavra-passe, e é o ponto: quem cria a conta
                * nunca a escolhe nem a vê. A pessoa recebe no email dela um
                * link para a definir.
                */}
              <p className="w-full rounded-lg bg-gray-100 p-3 text-xs text-gray-600 dark:bg-gray-700/40 dark:text-gray-300">
                A palavra-passe não se define aqui. Assim que a conta for
                criada, <strong>a pessoa recebe no email dela</strong> um link
                para a definir.
              </p>
            </form>
      </AppModal>
    </>
  )
}
