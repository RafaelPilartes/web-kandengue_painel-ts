// form
import { type Control, useFieldArray } from 'react-hook-form'
// icons
import { Plus } from 'lucide-react'
import { AiFillDelete } from 'react-icons/ai'
import { CustomInput } from './input/InputLabel'
// components

// Definindo o tipo das opções
interface Option {
  text: string
  is_valid: boolean
}

// Tipagem para o esquema do seu formulário
interface ExamQuestionFormValues {
  question_text: string
  value: string
  question_type: 'short_answer' | 'multiple_choice' | 'image_upload'
  options_modal?: Option[]
  image?: string
}

// Tipagem para as props do componente
interface MultipleChoiceOptionsModalProps {
  control: Control<ExamQuestionFormValues> // Definindo o controle com a tipagem correta
  options: Option[] // Lista de opções
}

export function MultipleChoiceOptionsModal({
  control
}: MultipleChoiceOptionsModalProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options_modal' // O nome precisa corresponder ao campo do formulário
  })

  const addOption = () => {
    append({ text: '', is_valid: false }) // Adiciona uma nova opção vazia
  }

  const removeOption = (optIndex: number) => {
    remove(optIndex) // Remove a opção pelo índice
  }

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, optIndex) => (
        <div key={field.id} className="flex flex-1 items-end gap-4">
          <div className="w-full">
            <CustomInput
              type="text"
              htmlFor={`options_modal.${optIndex}.text`}
              label={`Texto da opção`}
              placeholder="Ex.: Opção 1"
              control={control}
              defaultValue={field.text} // Inicializando com valores
            />
          </div>

          <label
            htmlFor={`options_modal.${optIndex}.is_valid`}
            className="relative custom-radio py-2.5 px-5 flex flex-row justify-start items-center gap-8 border dark:bg-gray-700/60 bg-gray-100/10  dark:border-gray-500/60 border-gray-300/60 dark:text-gray-300 text-gray-500 text-sm rounded-lg"
          >
            <span>Válido</span>
            <input
              id={`options_modal.${optIndex}.is_valid`}
              type="checkbox"
              className="custom-control-input bg-transparent text-primary-200 border-gray-400 focus:ring-0 rounded"
              {...control.register(`options_modal.${optIndex}.is_valid`)}
              defaultChecked={field.is_valid} // Inicializando com valores
            />
          </label>

          <button
            type="button"
            onClick={() => removeOption(optIndex)} // Chama a função de remover
            className="p-[0.650rem] rounded-lg bg-[#FF0000] text-white hover:bg-red-600 active:bg-red-900 flex flex-row items-center justify-center gap-2 transition-all duration-300 text-lg"
          >
            <AiFillDelete />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="w-[10rem] h-[2.6rem] rounded-lg bg-blue-500 text-white hover:bg-blue-700 active:bg-blue-900 flex flex-row items-center justify-center gap-2 transition-all duration-300 "
      >
        <Plus />
        Adicionar opção
      </button>
    </div>
  )
}
