import { useEffect, useMemo, useState } from 'react'
import { Landmark, ShieldAlert } from 'lucide-react'
import swal from 'sweetalert'
import { useAppConfigViewModel } from '@/viewModels/AppConfigViewModel'
import type { WalletTopupConfigPayload } from '@/core/interfaces/IAdminConfigRepository'
import { formatDateTimeFromFirestore } from '@/utils/date'

const vazio: WalletTopupConfigPayload = {
  iban: '',
  account_holder: '',
  holder_note: '',
  transfer_reference_hint: '',
  min_amount: 500
}

/**
 * Os dados bancários que o motorista vê ao escolher "Transferência".
 *
 * Vivem em `app_config/wallet_topup` e não no código porque o IBAN e o
 * titular mudam sem relação nenhuma com uma build — corrigir um dígito aqui
 * é imediato, no código esperava pela aprovação de uma loja.
 *
 * A escrita é da API: um dígito errado manda transferências para uma conta
 * que não é nossa, e isso não pode acontecer sem ficar registado quem o fez.
 */
export function WalletTopupSettings() {
  const { walletTopup, isLoadingWalletTopup, saveWalletTopup } =
    useAppConfigViewModel()

  const [form, setForm] = useState<WalletTopupConfigPayload>(vazio)

  useEffect(() => {
    if (!walletTopup) return
    setForm({
      iban: walletTopup.iban ?? '',
      account_holder: walletTopup.account_holder ?? '',
      holder_note: walletTopup.holder_note ?? '',
      transfer_reference_hint: walletTopup.transfer_reference_hint ?? '',
      min_amount: walletTopup.min_amount ?? 500
    })
  }, [walletTopup])

  const erros = useMemo(() => {
    const lista: string[] = []
    if (!form.iban.trim()) lista.push('O IBAN é obrigatório')
    if (!form.account_holder.trim()) lista.push('O titular é obrigatório')
    if (!Number.isFinite(form.min_amount) || form.min_amount <= 0) {
      lista.push('O valor mínimo tem de ser maior do que zero')
    }
    return lista
  }, [form])

  const ibanMudou =
    !!walletTopup && (walletTopup.iban ?? '') !== form.iban.trim()

  const alterado = useMemo(() => {
    if (!walletTopup) return false
    return (
      (walletTopup.iban ?? '') !== form.iban ||
      (walletTopup.account_holder ?? '') !== form.account_holder ||
      (walletTopup.holder_note ?? '') !== form.holder_note ||
      (walletTopup.transfer_reference_hint ?? '') !==
        form.transfer_reference_hint ||
      (walletTopup.min_amount ?? 0) !== form.min_amount
    )
  }, [walletTopup, form])

  async function handleSave() {
    if (erros.length > 0) return

    // Mudar o IBAN é mudar para onde o dinheiro dos motoristas vai. Mostra-se
    // o antes e o depois, porque é a única forma de apanhar um dígito trocado
    // antes de ele custar dinheiro a alguém.
    if (ibanMudou) {
      const confirma = await swal({
        title: 'Vais mudar o IBAN',
        text:
          `Antes: ${walletTopup?.iban}\n` +
          `Depois: ${form.iban.trim()}\n\n` +
          'É para esta conta que os motoristas vão transferir. Confirma dígito a dígito.',
        buttons: ['Cancelar', 'Confirmo o IBAN'],
        icon: 'warning',
        dangerMode: true
      })
      if (!confirma) return
    }

    try {
      const result = await saveWalletTopup.mutateAsync(form)
      swal(
        result.changed
          ? `Gravado: ${result.changed_fields.join(', ')}`
          : 'Nada mudou',
        { icon: result.changed ? 'success' : 'info' }
      )
    } catch (error) {
      swal('Erro ao gravar', {
        text:
          error instanceof Error
            ? error.message
            : 'Houve algum erro ao gravar os dados bancários...',
        icon: 'error'
      })
    }
  }

  if (isLoadingWalletTopup) {
    return <div className="text-sm text-gray-500">A carregar…</div>
  }

  const actualizado = walletTopup?.updated_at
    ? formatDateTimeFromFirestore(walletTopup.updated_at)
    : null

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Dados bancários dos carregamentos
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        O que o motorista vê ao escolher "Transferência" para carregar a
        carteira.
      </p>

      <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
        <div className="flex items-start gap-3">
          <ShieldAlert
            size={18}
            className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0"
          />
          <p className="text-sm text-gray-700 dark:text-gray-200">
            É para esta conta que os motoristas transferem. Um dígito errado no
            IBAN manda o dinheiro para outro sítio — a alteração fica registada
            com o antes e o depois, e com quem a fez.
          </p>
        </div>
      </div>

      {actualizado && (
        <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
          Última alteração a {actualizado.date} às {actualizado.time}
          {walletTopup?.updated_by ? ` por ${walletTopup.updated_by}` : ''}
        </p>
      )}

      <div className="space-y-4">
        <Campo
          label="IBAN"
          hint="Como se escreve ao copiar — a app mostra-o com um botão de copiar"
          value={form.iban}
          onChange={v => setForm(p => ({ ...p, iban: v }))}
          destaque={ibanMudou}
        />
        <Campo
          label="Titular da conta"
          hint="Tal como aparece no banco"
          value={form.account_holder}
          onChange={v => setForm(p => ({ ...p, account_holder: v }))}
        />
        <Campo
          label="Nota sobre o titular (opcional)"
          hint="Porque é que o titular não se chama Kandengue"
          value={form.holder_note ?? ''}
          onChange={v => setForm(p => ({ ...p, holder_note: v }))}
        />
        <Campo
          label="Instrução da referência (opcional)"
          hint="O que o motorista escreve na descrição da transferência"
          value={form.transfer_reference_hint ?? ''}
          onChange={v => setForm(p => ({ ...p, transfer_reference_hint: v }))}
        />

        <label className="flex flex-col gap-1 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Landmark size={16} className="text-gray-400" />
            Valor mínimo de carregamento (Kz)
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            A app do motorista lê daqui — estava fixo em 500 no ecrã
          </span>
          <input
            type="number"
            min={1}
            value={form.min_amount}
            onChange={e =>
              setForm(p => ({ ...p, min_amount: Number(e.target.value) }))
            }
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
      </div>

      {erros.length > 0 && (
        <ul className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
          {erros.map(e => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!alterado || erros.length > 0 || saveWalletTopup.isPending}
          className="px-6 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-medium text-sm disabled:opacity-40"
        >
          {saveWalletTopup.isPending ? 'A gravar…' : 'Gravar dados bancários'}
        </button>
        {ibanMudou && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            O IBAN mudou — vai pedir confirmação
          </span>
        )}
      </div>
    </div>
  )
}

function Campo({
  label,
  hint,
  value,
  onChange,
  destaque
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  destaque?: boolean
}) {
  return (
    <label
      className={`flex flex-col gap-1 p-4 rounded-xl bg-white dark:bg-gray-800 border ${
        destaque
          ? 'border-amber-300 dark:border-amber-700'
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
        {label}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {hint}
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-900 dark:text-gray-100"
      />
    </label>
  )
}
