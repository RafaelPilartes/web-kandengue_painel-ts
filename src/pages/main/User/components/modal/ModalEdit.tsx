import { useState } from 'react'
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
import uploadViewModel from '../../../../../services/ViewModel/UploadViewModel'
import UserViewModel from '../../../../../services/ViewModel/UserViewModel'
// Interfaces
import type { UserInterface } from '../../../../../interfaces/IUser'
// Type
import type { modalEditeType } from '../../../../../types/modal'
// Data
import { statusOptions } from '../../../../../data/selectOption'
// Utils
import { showToast } from '../../../../../utils/toasts'

// Component
import { CustomInput } from '../../../../../components/input/InputLabel'
import { SelectCustomZod } from '../../../../../components/selects/SelectCustomZod'

// Style
import { customStylesModalCenter } from '../../../../../styles/custom/modals'

const requiredStringField = (message = 'Campo obrigatório') =>
  z
    .string()
    .nonempty(message)
    .min(3, 'É necessário no mínimo 3 caracteres')
    .refine(value => value, {
      message: 'Por favor, preencha este campo'
    })

const formSchema = z
  .object({
    name: requiredStringField('O nome é obrigatório!'),
    email: z
      .string()
      .nonempty('O email é obrigatório!')
      .email('Formato de email invalido')
      .toLowerCase()
      .trim(),
    phone: requiredStringField(),
    status: z.enum(['active', 'inactive', 'pending', 'banned'], {
      message: "Selecione 'Ativo' ou 'Inativo'"
    }),
    password: z.string().optional(),
    confirm_password: z.string().optional()
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'As palavras-passe não coincidem',
    path: ['confirm_password'] // Atribui o erro ao campo correto.
  })

type formType = z.infer<typeof formSchema>

export function ModalEditUser({
  baseInfo,
  modalEditRowIsOpen,
  handleUpdateListing,
  setModalEditRowIsOpen
}: modalEditeType<UserInterface>) {
  // Loading
  const [isSend, setIsSend] = useState<boolean>(false)

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(
    baseInfo?.photo as string
  )

  // Const
  const namePageSingular = 'Usuario'

  const initialValues = {
    name: baseInfo.name,
    email: baseInfo.email,
    phone: baseInfo.phone,
    status: baseInfo.status,
    password: '',
    confirm_password: ''
  }

  // Form Zod
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<formType>({
    defaultValues: initialValues,
    resolver: zodResolver(formSchema)
  })

  // Modal
  function closeModal() {
    setModalEditRowIsOpen(false)
  }
  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  // OnChange
  const onImageChange = (e: any) => {
    const [file] = e.target.files
    const photo = e.target.files[0]
    setSelectedFile(photo)
    setImagePreview(URL.createObjectURL(file))
  }

  // Select
  const handleStatusChange = (valueSelected: string) => {
    console.log(`Selected: ${valueSelected}`)
  }

  // Function Submit Form
  async function handleSubmitForm(dataForm: any) {
    if (dataForm.password !== dataForm.confirm_password) {
      showToast('error', 'As palavras pass não convidem')
      return
    }

    setIsSend(true)

    let imageUrl: string | undefined = ''

    if (selectedFile) {
      const imageData = new FormData()
      imageData.append('imageUser', selectedFile)

      const responseUpload = await uploadViewModel.uploadUserPhoto(imageData)

      if (responseUpload.error) {
        showToast('error', responseUpload.msg as string)
        setIsSend(false)
        return
      }

      imageUrl = responseUpload.data ? responseUpload.data : ''
    }

    try {
      const { confirm_password, ...rest }: formType = dataForm
      const dataToSave: UserInterface = {
        ...rest,
        photo: imageUrl
      }

      const resultSubmit = await UserViewModel.update(
        baseInfo?.id as number,
        dataToSave
      )

      if (resultSubmit.error) {
        showToast('error', resultSubmit.msg)
      } else {
        showToast('success', resultSubmit.msg)
        setTimeout(() => {
          setIsSend(false)
          closeModal()
        }, 4000)

        handleUpdateListing()
      }
    } catch (error) {
      showToast('error', String(error) as string)
    } finally {
      setIsSend(false)
    }
  }

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
              <div className="w-full flex flex-col items-start justify-start">
                <div className="w-full max-w-[14rem] flex items-start justify-start ">
                  <label
                    htmlFor="dropzone-file"
                    className="w-full h-40 flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-70 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 transition-all duration-300 relative overflow-hidden"
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
                          PNG, JPG or JPEG (MAX. 3Mb)
                        </p>
                      </div>
                    )}

                    {imagePreview && (
                      <img
                        className=" w-full h-full object-cover absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                        src={imagePreview}
                        alt="Tchossy"
                      />
                    )}
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      onChange={onImageChange}
                    />
                  </label>
                </div>
              </div>

              <CustomInput
                type="text"
                htmlFor="name"
                label="Seu nome"
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

              <div className="w-full pt-4 flex flex-row justify-between items-center border-t-[1px] border-gray-600 ">
                <button
                  type="submit"
                  disabled={isSend}
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-2 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  {isSend && (
                    <>
                      <BeatLoader color="white" size={10} />
                    </>
                  )}

                  {!isSend && <span>Salvar alterações</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
}
