import { Button } from '@/components/ui/button'
import { useMemo, useState } from 'react'

// Lib
import { BeatLoader } from 'react-spinners'

// Form
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// ViewModels
import { useWalletsViewModel } from '@/viewModels/WalletViewModel'
import { useDriversViewModel } from '@/viewModels/DriverViewModel'

// Components
import { AppModal } from '@/components/modal/AppModal'
import { CustomInput } from '@/components/input/InputLabel'
import { SelectCustomZod } from '@/components/selects/SelectCustomZod'
import { SelectSearchableCustomZod } from '@/components/selects/SelectSearchableCustomZod'

// Types
import type { modalCreateType } from '@/types/modal'

// Utils
import { showToast } from '@/utils/toasts'
import { mapArrayToOptions } from '@/utils/arrays'
import { mapFirebaseError } from '@/helpers/mapFirebaseError'

const walletStatusOptions = [
  { value: 'active', label: 'Ativa' },
  { value: 'inactive', label: 'Inativa' }
]

const currencyOptions = [
  { value: 'AOA', label: 'AOA — Kwanza' },
  { value: 'USD', label: 'USD — Dólar' }
]

/*
 * O formulário guarda o **id** do motorista, não o objecto inteiro.
 *
 * Antes as opções levavam o motorista serializado em JSON no `value`, o
 * campo registado chamava-se `user_id` mas o esquema validava `user`, e o
 * objecto só lá chegava por um `setValue` manual depois de um `JSON.parse`.
 * Funcionava por acaso — a validação passava porque o `setValue` corria
 * primeiro. Com o id, o campo registado e o validado são o mesmo, e o
 * motorista procura-se na lista que já está em memória.
 */
const formSchema = z.object({
  user_id: z.string().min(1, 'Selecione um motorista'),
  // `coerce` porque o input devolve texto. Vazio passa a 0, que é o saldo
  // inicial natural de uma carteira nova.
  balance: z.coerce
    .number('O saldo deve ser numérico')
    .min(0, 'O saldo inicial não pode ser negativo'),
  status: z.enum(['active', 'inactive'], {
    error: () => ({ message: 'Selecione um estado válido' })
  }),
  currency: z.enum(['AOA', 'USD'], {
    error: () => ({ message: 'Selecione uma moeda válida' })
  })
})

/*
 * `z.coerce` faz a entrada e a saída divergirem: o input do formulário
 * entrega texto (`unknown` para o Zod) e o esquema devolve `number`. O
 * react-hook-form precisa de saber os dois — daí os três parâmetros de tipo
 * no `useForm`.
 */
type formInput = z.input<typeof formSchema>
type formOutput = z.output<typeof formSchema>

export function ModalCreateWallet({
  modalCreateRowIsOpen,
  setModalCreateRowIsOpen
}: modalCreateType<any>) {
  const { createWallet, fetchAllWalletsByField } = useWalletsViewModel()
  const [isSending, setIsSending] = useState(false)

  const { drivers, isLoadingDrivers } = useDriversViewModel(
    500,
    undefined,
    undefined,
    { status: 'active' }
  )

  const driverOptions = useMemo(() => mapArrayToOptions(drivers), [drivers])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<formInput, unknown, formOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: { user_id: '', balance: 0, status: 'active', currency: 'AOA' }
  })

  function closeModal() {
    reset()
    setModalCreateRowIsOpen(false)
  }

  async function handleSubmitForm(dataForm: formOutput) {
    const driver = drivers.find(d => String(d.id) === dataForm.user_id)

    if (!driver) {
      showToast('error', 'Motorista não encontrado. Recarregue a página.')
      return
    }

    if (!driver.firebase_uid || !driver.id) {
      showToast(
        'error',
        `O registo do motorista ${driver.name ?? 'seleccionado'} está incompleto ` +
          '(falta o ID ou a conta Firebase associada). Sem isso a carteira ficaria ' +
          'inacessível na app. Corrija o registo do motorista primeiro.'
      )
      return
    }

    setIsSending(true)

    try {
      const existing = await fetchAllWalletsByField('user.email', driver.email)

      if (existing?.data[0]) {
        showToast('error', 'O motorista selecionado já tem uma carteira criada!')
        return
      }

      const resultSubmit = await createWallet.mutateAsync({
        user_id: driver.id,
        user: { ...driver, id: driver.id, firebase_uid: driver.firebase_uid },
        initial_balance: dataForm.balance,
        currency: dataForm.currency,
        status: dataForm.status
      })

      if (!resultSubmit?.walletId) {
        showToast('error', 'Houve algum erro durante a criação da carteira')
        return
      }

      showToast('success', 'Carteira criada com sucesso!')
      // Fecha já. O atraso de 2s que aqui estava só prendia o ecrã aberto
      // depois de o trabalho estar feito.
      closeModal()
    } catch (error) {
      showToast('error', String(mapFirebaseError(error)))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AppModal
      isOpen={modalCreateRowIsOpen}
      onClose={closeModal}
      title="Criar carteira"
      description="A carteira fica associada a um motorista activo, e só pode haver uma por motorista."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal} disabled={isSending}>
            Cancelar
          </Button>
          {/* The button lives in the footer, so it submits the form through `form`. */}
          <Button type="submit" form="form-criar-carteira" loading={isSending}>
            Criar carteira
          </Button>
        </>
      }
    >
      <form
        id="form-criar-carteira"
        onSubmit={handleSubmit(handleSubmitForm)}
        className="flex w-full flex-col gap-6"
      >
        {isLoadingDrivers ? (
          <div className="flex w-full items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-300">
              A procurar motoristas…
            </span>
            <BeatLoader color="#e0212d" size={10} />
          </div>
        ) : (
          <SelectSearchableCustomZod
            name="user_id"
            label="Motorista"
            control={control}
            error={errors.user_id}
            options={driverOptions}
            onOptionChange={() => {}}
          />
        )}

        <CustomInput
          htmlFor="balance"
          label="Saldo inicial"
          type="number"
          placeholder="0"
          control={control}
          error={errors.balance}
        />

        <SelectCustomZod
          name="status"
          label="Estado"
          control={control}
          error={errors.status}
          options={walletStatusOptions}
          defaultValue="active"
          onOptionChange={() => {}}
        />

        <SelectCustomZod
          name="currency"
          label="Moeda"
          control={control}
          error={errors.currency}
          options={currencyOptions}
          defaultValue="AOA"
          onOptionChange={() => {}}
        />
      </form>
    </AppModal>
  )
}
