import { useState } from 'react'

// Lib
import Modal from 'react-modal'
import { X } from 'lucide-react'
import { BeatLoader } from 'react-spinners'

// Form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Services
import uploadViewModel from '../../../../../services/ViewModel/UploadViewModel'
import UserViewModel from '../../../../../services/ViewModel/UserViewModel'

// Data
import { statusOptions } from '../../../../../data/selectOption'

// Component
import { CustomInput } from '../../../../../components/input/InputLabel'
import { SelectCustomZod } from '../../../../../components/selects/SelectCustomZod'

// Style
import { customStylesModalCenter } from '../../../../../styles/custom/modals'

// Types
import type { modalCreateType } from '../../../../../types/modal'

// Interfaces
import type { UserInterface } from '../../../../../interfaces/IUser'

// Utils
import { showToast } from '../../../../../utils/toasts'
import { ToastContainer } from 'react-toastify'
import { validationFileImage } from '../../../../../utils/file'

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
      .min(5, 'É necessário no mínimo 5 caracteres')
      .refine(value => value, {
        message: 'Por favor, preencha este campo.'
      })
      .email('Formato de email invalido')
      .toLowerCase()
      .trim(),
    phone: requiredStringField(),
    status: z.enum(['active', 'inactive'], {
      message: "Selecione 'Ativo' ou 'Inativo'"
    }),
    password: z
      .string()
      .nonempty('A palavra-passe é obrigatória!')
      .min(6, 'A palavra-passe tem de no mínimo 6 caracteres')
      .trim()
      .refine(value => value, {
        message: 'Por favor, preencha este campo.'
      }),
    confirm_password: z
      .string()
      .min(6, 'A confirmação de palavra-passe deve ter no mínimo 6 caracteres')
    // birth_date: z.string().refine(
    //   value => {
    //     return value != ''
    //   },
    //   {
    //     message: 'Por favor, informe data de aniversario'
    //   }
    // ),
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'As palavras-passe não coincidem',
    path: ['confirm_password'] // Atribui o erro ao campo correto.
  })
type formType = z.infer<typeof formSchema>

export function ModalCreateUser({
  handleUpdateListing,
  modalCreateRowIsOpen,
  setModalCreateRowIsOpen
}: modalCreateType<any>) {
  // Loading
  const [isSend, setIsSend] = useState<boolean>(false)

  // Image
  const [selectedFile, setSelectedFile] = useState<string>('')
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
  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  // Image
  const handleImageChange = (e: any) => {
    const [file] = e.target.files
    const photo = e.target.files[0]

    const { error, message } = validationFileImage(photo, 5)
    if (error) {
      showToast('error', message)
      return
    }

    if (file) {
      setSelectedFile(photo)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Handle Select
  const handleStatusChange = (valueSelected: string) => {
    console.log(`Selected: ${valueSelected}`)
  }

  // Function Upload Photo
  async function handleUploadPhoto(): Promise<{
    urlPhoto: string
    msgUpload: string
  }> {
    if (!selectedFile) showToast('error', 'Imagem não selecionada')

    console.log('Uploading photo...')

    const formData = new FormData()
    formData.append('imageUser', selectedFile)

    const result = await uploadViewModel.uploadUserPhoto(formData)

    if (result.error) {
      throw new Error(result.msg)
    }

    const urlPhoto = result.data as string
    const msgUpload = result.msg as string

    console.log(result)

    return {
      urlPhoto,
      msgUpload
    }
  }

  // Function Submit Form
  async function handleSubmitForm(dataForm: any) {
    if (dataForm.password !== dataForm.confirm_password) {
      showToast('error', 'As palavras pass não convidem')
      return
    }

    setIsSend(true)

    try {
      let imageUploaded =
        'https://cdn-icons-png.flaticon.com/256/354/354637.png'

      if (selectedFile) {
        // Primeiro, faz o upload da imagem
        const resUrl = await handleUploadPhoto()

        const { urlPhoto, msgUpload } = resUrl

        if (!urlPhoto) {
          showToast('error', msgUpload)
          setIsSend(false)
          return
        }

        imageUploaded = urlPhoto
      }

      const dataToSave: UserInterface = {
        ...dataForm,
        photo: imageUploaded
      }

      const resultSubmit = await UserViewModel.create(dataToSave)

      if (resultSubmit.error) {
        showToast('error', resultSubmit.msg)
        setIsSend(false)
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
      setIsSend(false)
    }
  }

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

                  {!isSend && <span>Criar</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
}
