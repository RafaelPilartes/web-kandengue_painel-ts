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
import ServiceRequestViewModel from '../../../../../services/ViewModel/ServiceRequestViewModel'

// Data
import { requestStatusOptions } from '../../../../../data/selectOption'

// Component
import { CustomInput } from '../../../../../components/input/InputLabel'
import { SelectCustomZod } from '../../../../../components/selects/SelectCustomZod'

// Style
import { customStylesModalCenter } from '../../../../../styles/custom/modals'

// Types
import { modalCreateType } from '../../../../../types/modal'

// Interfaces
import { ServiceRequestInterface } from '../../../../../interfaces/IServiceRequest'

// Utils
import { showToast } from '../../../../../utils/toasts'
import { ToastContainer } from 'react-toastify'
import { OptionType } from '../../../../../types/option'
import { SelectSearchableCustomZod } from '../../../../../components/selects/SelectSearchableCustomZod'
import PatientViewModel from '../../../../../services/ViewModel/PatientViewModel'
import { PatientInterface } from '../../../../../interfaces/IPatient'
import ServiceViewModel from '../../../../../services/ViewModel/ServiceViewModel'
import { ServiceInterface } from '../../../../../interfaces/IService'
import { TextAreaLabel } from '../../../../../components/input/TextAreaLabelZod'

const requiredStringField = (message = 'Campo obrigatório') =>
  z.string({ required_error: message }).refine(value => value, {
    message: 'Por favor, preencha este campo'
  })

const formSchema = z.object({
  patient_id: requiredStringField('Selecione um paciente!'),
  service_id: requiredStringField('Selecione um serviço!'),
  requested_date: requiredStringField(),
  location: requiredStringField(),
  status: z.enum(['pending', 'in_progress', 'completed', 'canceled'], {
    errorMap: () => ({
      message: 'Selecione uma opção valida'
    })
  }),
  notes: requiredStringField()
})
type formType = z.infer<typeof formSchema>

export function ModalCreateServiceRequest({
  handleUpdateListing,
  modalCreateRowIsOpen,
  setModalCreateRowIsOpen
}: modalCreateType<any>) {
  // Loading
  const [isSending, setIsSending] = useState<boolean>(false)
  const [isGettingPatients, setIsGettingPatients] = useState<boolean>(true)
  const [isGettingServices, setIsGettingServices] = useState<boolean>(true)

  // Data
  const [rowsPatientOption, setRowsPatientOption] = useState<OptionType[]>([])
  const [rowsServiceOption, setRowsServiceOption] = useState<OptionType[]>([])

  // Const
  const namePageSingular = 'Solicitação de Serviço'

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

  // Handle Select
  const handleNull = (valueSelected: string) => {
    console.log(`Selected: ${valueSelected}`)
    return
  }

  const handlePatientChange = (valueSelected: string) => {
    console.log(`Selected: ${valueSelected}`)
  }
  const handleServiceChange = (valueSelected: string) => {
    console.log(`Selected: ${valueSelected}`)
  }

  // Function Submit Form
  async function handleSubmitForm(dataForm: any) {
    setIsSending(true)

    console.log('dataForm', dataForm)

    try {
      const dataToSave: ServiceRequestInterface = {
        ...dataForm
      }

      const resultSubmit = await ServiceRequestViewModel.create(dataToSave)

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

  async function fetchPatientData() {
    setIsGettingPatients(true)
    // Clear
    setRowsPatientOption([])

    await PatientViewModel.getAll()
      .then(async response => {
        if (response.error) {
          console.error('error', response.msg as string)
        } else {
          const arrayData = response.data as PatientInterface[]
          const dataOptions = arrayData
            .filter(data => data.id !== undefined)
            .map(data => ({
              value: String(data.id),
              label: data.user.name
            }))
          setRowsPatientOption(dataOptions)
        }
      })
      .catch(err => {
        console.error('Error to get all => ', err)
      })
      .finally(() => {
        setIsGettingPatients(false)
      })
  }
  async function fetchServiceData() {
    setIsGettingServices(true)
    // Clear
    setRowsServiceOption([])

    await ServiceViewModel.getAll()
      .then(async response => {
        if (response.error) {
          console.error('error', response.msg as string)
        } else {
          const arrayData = response.data as ServiceInterface[]
          const dataOptions = arrayData
            .filter(data => data.id !== undefined)
            .map(data => ({
              value: String(data.id),
              label: data.name
            }))
          setRowsServiceOption(dataOptions)
        }
      })
      .catch(err => {
        console.error('Error to get all => ', err)
      })
      .finally(() => {
        setIsGettingServices(false)
      })
  }

  useEffect(() => {
    fetchPatientData()
    fetchServiceData()
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
              <div className="w-full grid gap-6 md:grid-cols-2">
                <div>
                  {isGettingPatients && (
                    <>
                      <div className="w-full flex flex-row justify-start items-center gap-4">
                        <span className="text-sm font-medium  text-light">
                          Buscando pacientes!
                        </span>
                        <BeatLoader color="white" size={10} />
                      </div>
                    </>
                  )}

                  {!isGettingPatients && (
                    <>
                      <SelectSearchableCustomZod
                        name="patient_id"
                        label="Paciente*"
                        control={control}
                        error={errors.patient_id}
                        options={rowsPatientOption}
                        onOptionChange={e => handlePatientChange(e as string)}
                      />
                    </>
                  )}
                </div>
                <div>
                  {isGettingServices && (
                    <>
                      <div className="w-full flex flex-row justify-start items-center gap-4">
                        <span className="text-sm font-medium  text-light">
                          Buscando serviços!
                        </span>
                        <BeatLoader color="white" size={10} />
                      </div>
                    </>
                  )}

                  {!isGettingServices && (
                    <>
                      <SelectSearchableCustomZod
                        name="service_id"
                        label="Serviço*"
                        control={control}
                        error={errors.service_id}
                        options={rowsServiceOption}
                        onOptionChange={e => handleServiceChange(e as string)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="w-full grid gap-6 md:grid-cols-2">
                <CustomInput
                  type="datetime-local"
                  htmlFor="requested_date"
                  label="Data da consulta*"
                  placeholder="Ex.: 01/01/2025"
                  control={control}
                  error={errors.requested_date}
                />

                <SelectCustomZod
                  name="status"
                  label="Status*"
                  control={control}
                  error={errors.status}
                  options={requestStatusOptions}
                  onOptionChange={handleNull}
                />
              </div>

              <CustomInput
                type="text"
                htmlFor="location"
                label="Local da consulta*"
                placeholder="Ex.: Rua 1, 123"
                control={control}
                error={errors.location}
              />

              <TextAreaLabel
                htmlFor="notes"
                label="Observações"
                placeholder="Ex.: Nenhuma"
                control={control}
                error={errors.notes}
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
