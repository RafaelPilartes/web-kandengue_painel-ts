import { AppModal } from '@/components/modal/AppModal'
import { Button } from '@/components/ui/button'
import { TextAreaField } from '@/components/ui/field'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, X, DollarSign } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import {
  useWithdrawalDetailViewModel,
  useWithdrawalsViewModel
} from '@/viewModels/WithdrawalViewModel'
import { formatMoney } from '@/utils/number'
import { showToast } from '@/utils/toasts'

export function WithdrawalDetailsPage() {
  const { withdrawalId } = useParams<{ withdrawalId: string }>()
  const navigate = useNavigate()

  const { withdrawal, earnings, isLoading } =
    useWithdrawalDetailViewModel(withdrawalId)
  const { approve, reject, markAsPaid } = useWithdrawalsViewModel()

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const items = [
    { label: 'Painel', to: routsNameMain.home },
    {
      label: 'Saques de referência',
      to: routsNameMain.referral.withdrawals.index
    },
    { label: withdrawalId ?? '' }
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={48} className="animate-spin text-primary-500" />
      </div>
    )
  }

  if (!withdrawal) {
    return (
      <div className="py-20 text-center text-gray-500">
        Saque não encontrado.
      </div>
    )
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      const result = await approve.mutateAsync(withdrawal.id)

      if (result.changed) {
        showToast('success', 'Saque aprovado')
      } else {
        // A API é idempotente: repetir não muda nada — outro admin já
        // aprovou este saque entretanto.
        showToast('info', 'Este saque já tinha sido aprovado')
      }
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast('error', 'Informa o motivo da rejeição')
      return
    }
    setSubmitting(true)
    try {
      const result = await reject.mutateAsync({
        id: withdrawal.id,
        reason: rejectReason.trim()
      })

      if (result.changed) {
        showToast(
          'success',
          `Saque rejeitado e ${result.revertedEarnings} earnings revertidos`
        )
      } else {
        // A API é idempotente: repetir não muda nada — outro admin já
        // rejeitou este saque entretanto.
        showToast('info', 'Este saque já tinha sido rejeitado')
      }
      setRejectModalOpen(false)
      setRejectReason('')
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAsPaid = async () => {
    if (!window.confirm('Confirma que o pagamento foi efetuado ao utilizador?'))
      return
    setSubmitting(true)
    try {
      const result = await markAsPaid.mutateAsync(withdrawal.id)

      if (result.changed) {
        showToast(
          'success',
          `Saque marcado como pago (${result.paidEarnings} earnings)`
        )
      } else {
        // A API é idempotente: repetir não muda nada — outro admin já
        // marcou este saque como pago entretanto.
        showToast('info', 'Este saque já tinha sido marcado como pago')
      }
    } catch (err: any) {
      showToast('error', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canApprove = withdrawal.status === 'pending'
  const canReject = ['pending', 'approved'].includes(withdrawal.status)
  // A API só paga um saque `approved` — pagar directo de `pending` saltaria
  // o passo de aprovação e a segregação de funções que ele dá.
  const canPay = withdrawal.status === 'approved'

  return (
    <div className="w-full flex flex-col gap-6">
      <Breadcrumbs items={items} />

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Detalhe do saque
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumo */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">
            Resumo
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {formatMoney(withdrawal.total_amount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Status: <span className="font-semibold">{withdrawal.status}</span>
          </p>
          <p className="text-xs text-gray-500">
            Criado em: {withdrawal.created_at.toLocaleString('pt-PT')}
          </p>
          {withdrawal.reviewed_at && (
            <p className="text-xs text-gray-500">
              Revisto em: {withdrawal.reviewed_at.toLocaleString('pt-PT')}
            </p>
          )}
          {withdrawal.paid_at && (
            <p className="text-xs text-gray-500">
              Pago em: {withdrawal.paid_at.toLocaleString('pt-PT')}
            </p>
          )}
          {withdrawal.admin_notes && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
              <p className="font-semibold">Motivo da rejeição:</p>
              <p>{withdrawal.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Dados bancários */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">
            Dados bancários
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Banco</dt>
              <dd className="font-semibold text-gray-800 dark:text-white">
                {withdrawal.payment_details.bank_name}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Número de conta</dt>
              <dd className="font-mono text-gray-800 dark:text-white">
                {withdrawal.payment_details.account_number}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Titular</dt>
              <dd className="font-semibold text-gray-800 dark:text-white">
                {withdrawal.payment_details.account_holder}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">User ID</dt>
              <dd className="font-mono text-xs text-gray-800 dark:text-white break-all">
                {withdrawal.user_id}
              </dd>
            </div>
          </dl>
        </div>

        {/* Ações */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm uppercase font-semibold text-gray-500 mb-4">
            Ações
          </h3>
          {withdrawal.status === 'pending' && (
            <p className="text-sm text-gray-500 mb-4">
              Aprova o saque antes de o marcar como pago.
            </p>
          )}
          <div className="flex flex-col gap-2">
            <button
              disabled={!canApprove || submitting}
              onClick={handleApprove}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg disabled:opacity-40"
            >
              <Check size={16} /> Aprovar
            </button>
            <button
              disabled={!canPay || submitting}
              onClick={handleMarkAsPaid}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg disabled:opacity-40"
            >
              <DollarSign size={16} /> Marcar como pago
            </button>
            <button
              disabled={!canReject || submitting}
              onClick={() => setRejectModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg disabled:opacity-40"
            >
              <X size={16} /> Rejeitar
            </button>
          </div>
        </div>
      </div>

      {/* Earnings ligados */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
        <h3 className="px-6 py-4 text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-700">
          Ganhos incluídos ({earnings.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-gray-600 dark:text-gray-300">
                <th className="px-4 py-3">Promoção</th>
                <th className="px-4 py-3">Ride</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {earnings.map(e => (
                <tr
                  key={e.id}
                  className="text-gray-800 dark:text-gray-200"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {e.promotion_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {e.ride_id.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3">{e.reward_type}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatMoney(e.reward_amount)}
                  </td>
                  <td className="px-4 py-3 text-xs">{e.status}</td>
                  <td className="px-4 py-3 text-xs">
                    {e.created_at.toLocaleString('pt-PT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        variant="center"
        size="sm"
        title="Rejeitar saque"
        description='Os ganhos voltam a "pendente".'
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReject}
              loading={submitting}
              disabled={!rejectReason.trim()}
            >
              Confirmar rejeição
            </Button>
          </>
        }
      >
        <TextAreaField
          label="Motivo da rejeição"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Ex.: dados bancários inválidos…"
        />
      </AppModal>
    </div>
  )
}
