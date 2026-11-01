import { Button } from '@/components/ui/button'
import { useAdminStore } from '@/stores/userStore'
import {
  useAdminDirectory,
  useDepartmentProfiles,
  useDepartments,
  useSetAdminAccess,
  useSetDirectionMark,
  useUpdateAdminProfile
} from '@/viewModels/AccessViewModel'
import { useAccess } from '@/hooks/useAccess'
import {
  canAssignProfile,
  canEditAdminAccount,
  canSetDirectionMark,
  canTouchAdminAccount
} from '@rafaelpilartes/kandengue-shared/functions'
import type { UpdateAdminBody } from '@/modules/Api/rest/adminAccess.dao'
import { AppModal } from '@/components/modal/AppModal'
import { useState, useEffect } from 'react'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { useFileUploadViewModel } from '@/viewModels/FileUploadViewModel'
import { statusOptions } from '@/data/selectOption'
import { genderOptions } from './genderOptions'

import { CustomInput } from '@/components/input/InputLabel'
import { SelectCustomZod } from '@/components/selects/SelectCustomZod'

import type { modalEditType } from '@/types/modal'
import type { AdminInterface } from '@/interfaces/IAdmin'
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
  }),
  department_id: z.string().optional(),
  profile_id: z.string().optional(),
  // Empty is a real answer: the greeting stays neutral.
  gender: z.enum(['female', 'male']).optional()
})
type formType = z.infer<typeof formSchema>

export function ModalEditAdmin({
  modalEditRowIsOpen,
  setModalEditRowIsOpen,
  baseInfo
}: modalEditType<AdminInterface>) {
  const updateProfile = useUpdateAdminProfile()
  const setDirectionMark = useSetDirectionMark()
  const { uploadSimple, isUploading, uploadError } = useFileUploadViewModel()

  const { departments } = useDepartments()
  const { byId: accessById } = useAdminDirectory()
  const setAccess = useSetAdminAccess()
  const current = accessById.get(baseInfo.id as string)
  // The API refuses changing one's own access; say so instead of failing on save.
  const currentAdminData = useAdminStore(s => s.currentAdminData)
  const addAdmin = useAdminStore(s => s.addAdmin)
  const isSelf = currentAdminData?.id === baseInfo.id

  /*
   * The panel only HIDES; the API is what refuses. Both call the same guards
   * from the shared library with the same `AdminAccess`, so what is greyed out
   * here is exactly what would come back 403 — a second copy of these rules
   * would drift, and it would drift in who can grant power.
   *
   * Three different questions, and they are not the same one:
   *   touch   may this ACCOUNT be changed at all (its mark says)
   *   edit    may its own fields be changed (that is managing accounts)
   *   assign  may THIS profile be handed out (own department, not sensitive)
   */
  const { access } = useAccess()
  const target = { is_direction: current?.is_direction === true }
  const mayTouchThisAccount = canTouchAdminAccount(access, target)
  const mayEditFields = canEditAdminAccount(access, target)
  const mayMark = canSetDirectionMark(access)

  const [departmentId, setDepartmentId] = useState<string | undefined>(
    current?.department_id ?? undefined
  )
  const { profiles } = useDepartmentProfiles(departmentId ?? null)
  const profileOptions = profiles
    .filter(
      p => (p.active || p.id === current?.profile_id) && canAssignProfile(access, p)
    )
    .map(p => ({ value: p.id, label: p.name }))

  const departmentOptions = departments
    .filter(d => d.active || d.id === current?.department_id)
    .map(d => ({ value: d.id, label: d.name }))

  const [isDirectionMark, setIsDirectionMark] = useState(
    current?.is_direction === true
  )
  const [selectedFile, setSelectedFile] = useState<File | undefined>()
  const [imagePreview, setImagePreview] = useState<string>(
    baseInfo?.photo || ''
  )

  const namePageSingular = 'Usuário'

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<formType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: baseInfo?.name || '',
      email: baseInfo?.email || '',
      phone: baseInfo?.phone || '',
      status: (baseInfo?.status as any) || 'active',
      department_id: current?.department_id ?? undefined,
      profile_id: current?.profile_id ?? undefined,
      gender: baseInfo?.gender ?? undefined
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
        profile_id: current?.profile_id ?? undefined,
        gender: baseInfo.gender ?? undefined
      })
      setDepartmentId(current?.department_id ?? undefined)
      setIsDirectionMark(current?.is_direction === true)
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

      const { department_id, profile_id, name, phone, status, gender } = dataForm

      /*
       * The profile goes through the API, audited there — `/admins/{id}` is
       * `allow write: if false` in the Firestore rules, and the direct write
       * the panel used to do was denied without a word on the screen.
       *
       * The email is not sent: it is the Auth identity, and the field is
       * disabled in the form for the same reason.
       *
       * Only what actually changed is sent, because `changed_fields` of the
       * audit line is built from the keys of this body: sending all four every
       * time makes every line claim four changes when one was made.
       */
      const values: UpdateAdminBody = {}
      if (name !== baseInfo?.name) values.name = name
      if (phone !== baseInfo?.phone) values.phone = phone
      if (status !== baseInfo?.status) values.status = status
      if (imageUploaded !== (baseInfo?.photo || '')) values.photo = imageUploaded
      /*
       * `null` clears it. Absent means neutral and the account starts there;
       * a gender set by mistake has to be removable, or the field is a
       * one-way door on how a real person is addressed.
       */
      if ((gender ?? null) !== (baseInfo?.gender ?? null))
        values.gender = gender ?? null

      /*
       * ⚠️ Not silently skipped. The fields are editable whenever the account
       * may be TOUCHED, which is a weaker condition than being allowed to
       * change them — so someone could type a new phone number, press Guardar,
       * and be told it worked while nothing was written.
       */
      if (Object.keys(values).length > 0) {
        if (!mayEditFields) {
          showToast(
            'error',
            'Não pode alterar os dados desta conta. Só o departamento e o perfil.'
          )
          return
        }
        await updateProfile.mutateAsync({
          adminId: baseInfo.id as string,
          values
        })
      }

      const accessChanged =
        department_id !== (current?.department_id ?? undefined) ||
        profile_id !== (current?.profile_id ?? undefined)
      if (!isSelf && accessChanged) {
        if (!department_id || !profile_id) {
          showToast('error', 'Escolha o departamento e o perfil.')
          return
        }
        await setAccess.mutateAsync({
          adminId: baseInfo.id as string,
          department_id,
          profile_id
        })
      }

      /*
       * The mark is its own call, as it is its own route in the API. Sent only
       * when it actually changed, and never for oneself — the API refuses both,
       * and saying so here saves a round trip that would only fail.
       */
      if (mayMark && !isSelf && isDirectionMark !== (current?.is_direction === true)) {
        await setDirectionMark.mutateAsync({
          adminId: baseInfo.id as string,
          isDirection: isDirectionMark
        })
      }

      /*
       * Editing one's OWN account has to reach the store, or the screen keeps
       * showing what was persisted at login — the greeting on the home page
       * would go on using the old name or the old form of address until the
       * next sign-in.
       */
      if (isSelf && currentAdminData) {
        addAdmin({
          ...currentAdminData,
          ...values,
          // `null` means "cleared": the store keeps the field absent, which is
          // what the neutral greeting reads.
          gender: values.gender ?? undefined
        })
      }

      showToast('success', 'Administrador actualizado com sucesso!')
      setTimeout(() => {
        closeModal()
      }, 2000)
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
          <Button
            type="submit"
            form="admin-edit"
            disabled={!mayTouchThisAccount}
            loading={
              isUploading ||
              updateProfile.isPending ||
              setAccess.isPending ||
              setDirectionMark.isPending
            }
          >
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
              isDisabled={!mayEditFields}
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

            <div className="w-full grid gap-6 md:grid-cols-2">
              <SelectCustomZod
                name="status"
                label="Estado da conta"
                control={control}
                error={errors.status}
                options={statusOptions}
                onOptionChange={() => null}
              />
              <SelectCustomZod
                name="gender"
                label="Tratamento na saudação"
                control={control}
                error={errors.gender}
                options={genderOptions}
                onOptionChange={() => null}
              />
            </div>

            <div className="w-full grid gap-6 md:grid-cols-2">
              <SelectCustomZod
                name="department_id"
                label="Departamento"
                control={control}
                error={errors.department_id}
                options={departmentOptions}
                isDisabled={isSelf || !mayTouchThisAccount}
                onOptionChange={value => {
                  setDepartmentId(value)
                  // The chosen profile belongs to the department chosen
                  // before: it cannot stay selected.
                  setValue('profile_id', '')
                }}
              />
              <SelectCustomZod
                name="profile_id"
                label="Perfil"
                control={control}
                error={errors.profile_id}
                options={profileOptions}
                isDisabled={isSelf || !mayTouchThisAccount || !departmentId}
                onOptionChange={() => null}
              />
            </div>

            {/* The mark lives outside the departments, and only Direction sees it. */}
            {mayMark && !isSelf && (
              <label className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <input
                  type="checkbox"
                  checked={isDirectionMark}
                  onChange={event => setIsDirectionMark(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary-200"
                />
                <span className="text-sm">
                  <span className="font-semibold">Direcção</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Dá todas as permissões, sem depender do departamento nem do
                    perfil. Só a Direcção dá ou tira esta marca.
                  </span>
                </span>
              </label>
            )}
            {isSelf && (
              <p className="w-full text-xs text-gray-500 dark:text-gray-400">
                Não pode alterar o seu próprio departamento nem o seu nível. Peça a
                outra pessoa da Direcção.
              </p>
            )}
            {!isSelf && !mayTouchThisAccount && (
              <p className="w-full text-xs text-gray-500 dark:text-gray-400">
                Esta conta tem a marca de Direcção: só outra pessoa da Direcção
                a pode alterar.
              </p>
            )}
            </form>
    </AppModal>
  )
}
