import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { ArrowLeft, Save } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { PromotionEntity } from '@/core/entities/Promotion'
import type {
  PromotionType,
  RideKind,
  RidePaymentMethod
} from '@/interfaces/IPromotion'
import {
  usePromotionDetailViewModel,
  usePromotionsViewModel
} from '@/viewModels/PromotionViewModel'
import { showToast } from '@/utils/toasts'

const RIDE_TYPES: RideKind[] = ['car', 'motorcycle', 'bicycle', 'delivery']
const PAYMENT_METHODS: RidePaymentMethod[] = ['cash', 'card', 'wallet']

interface FormState {
  code: string
  type: PromotionType
  value: number
  max_discount: string
  min_ride_value: string
  usage_limit_total: string
  usage_limit_per_user: string
  valid_from: string
  valid_until: string
  active: boolean
  // rules
  new_users_only: boolean
  inactive_days: string
  has_specific_users: boolean
  ride_types: RideKind[]
  payment_methods: RidePaymentMethod[]
  origin_cities: string
  destination_cities: string
  cities_match: 'both' | 'any'
  // referral
  referral_enabled: boolean
  referral_owner_user_id: string
  referral_reward_type: 'fixed' | 'percentage'
  referral_reward_value: number
}

const emptyState: FormState = {
  code: '',
  type: 'percentage',
  value: 10,
  max_discount: '',
  min_ride_value: '',
  usage_limit_total: '',
  usage_limit_per_user: '',
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  active: true,
  new_users_only: false,
  inactive_days: '',
  has_specific_users: false,
  ride_types: [],
  payment_methods: [],
  origin_cities: '',
  destination_cities: '',
  cities_match: 'both',
  referral_enabled: false,
  referral_owner_user_id: '',
  referral_reward_type: 'fixed',
  referral_reward_value: 0
}

function entityToForm(p: PromotionEntity): FormState {
  return {
    code: p.code,
    type: p.type,
    value: p.value,
    max_discount: p.max_discount?.toString() ?? '',
    min_ride_value: p.min_ride_value?.toString() ?? '',
    usage_limit_total: p.usage_limit_total?.toString() ?? '',
    usage_limit_per_user: p.usage_limit_per_user?.toString() ?? '',
    valid_from: p.valid_from.toISOString().slice(0, 10),
    valid_until: p.valid_until.toISOString().slice(0, 10),
    active: p.active,
    new_users_only: !!p.rules.new_users_only,
    inactive_days: p.rules.inactive_days?.toString() ?? '',
    has_specific_users: !!p.rules.has_specific_users,
    ride_types: p.rules.ride_types ?? [],
    payment_methods: p.rules.payment_methods ?? [],
    origin_cities: (p.rules.allowed_cities?.origin ?? []).join(', '),
    destination_cities: (p.rules.allowed_cities?.destination ?? []).join(', '),
    cities_match: p.rules.allowed_cities?.match ?? 'both',
    referral_enabled: !!p.referral?.enabled,
    referral_owner_user_id: p.referral?.owner_user_id ?? '',
    referral_reward_type: p.referral?.reward_type ?? 'fixed',
    referral_reward_value: p.referral?.reward_value ?? 0
  }
}

function parseCsvIds(text: string): string[] {
  return text
    .split(/[\s,;\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

const inputClasses =
  'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:focus:ring-primary-500/20 dark:focus:border-primary-500 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 outline-none shadow-sm disabled:bg-gray-50 disabled:dark:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-100 disabled:dark:border-gray-800 disabled:shadow-none disabled:hover:border-gray-100 disabled:dark:hover:border-gray-800'

export function PromotionFormPage() {
  const navigate = useNavigate()
  const { code: codeParam } = useParams<{ code: string }>()
  const isEdit = !!codeParam

  const { promotion, isLoading } = usePromotionDetailViewModel(codeParam)
  const { createPromotion, updatePromotion, addAllowedUsersBulk } =
    usePromotionsViewModel()

  const [form, setForm] = useState<FormState>(emptyState)
  const [csvText, setCsvText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit && promotion) {
      setForm(entityToForm(promotion))
    }
  }, [isEdit, promotion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const validFrom = new Date(form.valid_from)
      const validUntil = new Date(form.valid_until)
      if (validUntil <= validFrom) {
        showToast('error', 'A data de fim deve ser posterior à de início')
        setSubmitting(false)
        return
      }

      const payload: Omit<PromotionEntity, 'id'> = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        max_discount: form.max_discount ? Number(form.max_discount) : undefined,
        min_ride_value: form.min_ride_value
          ? Number(form.min_ride_value)
          : undefined,
        usage_limit_total: form.usage_limit_total
          ? Number(form.usage_limit_total)
          : undefined,
        usage_limit_per_user: form.usage_limit_per_user
          ? Number(form.usage_limit_per_user)
          : undefined,
        used_count_approx: 0,
        reserved_count_approx: 0,
        valid_from: validFrom,
        valid_until: validUntil,
        active: form.active,
        rules: {
          new_users_only: form.new_users_only || undefined,
          inactive_days: form.inactive_days
            ? Number(form.inactive_days)
            : undefined,
          has_specific_users: form.has_specific_users || undefined,
          ride_types: form.ride_types.length ? form.ride_types : undefined,
          payment_methods: form.payment_methods.length
            ? form.payment_methods
            : undefined,
          allowed_cities:
            form.origin_cities || form.destination_cities
              ? {
                  origin: parseCsvIds(form.origin_cities).map(s =>
                    s.toLowerCase()
                  ),
                  destination: parseCsvIds(form.destination_cities).map(s =>
                    s.toLowerCase()
                  ),
                  match: form.cities_match
                }
              : undefined
        },
        referral: form.referral_enabled
          ? {
              enabled: true,
              owner_user_id: form.referral_owner_user_id.trim(),
              reward_type: form.referral_reward_type,
              reward_value: Number(form.referral_reward_value)
            }
          : undefined,
        created_by: '',
        created_at: new Date()
      }

      if (isEdit) {
        await updatePromotion.mutateAsync({
          code: payload.code,
          patch: payload
        })
        showToast('success', 'Promoção atualizada')
      } else {
        await createPromotion.mutateAsync(payload)
        showToast('success', 'Promoção criada')
      }

      // CSV de utilizadores específicos
      if (form.has_specific_users && csvText.trim()) {
        const ids = parseCsvIds(csvText)
        if (ids.length > 0) {
          await addAllowedUsersBulk.mutateAsync({
            code: payload.code,
            userIds: ids
          })
          showToast('success', `${ids.length} utilizadores adicionados`)
        }
      }

      navigate(routsNameMain.promotions.index)
    } catch (err: any) {
      showToast('error', err.message ?? 'Erro ao salvar promoção')
    } finally {
      setSubmitting(false)
    }
  }

  const items = [
    { label: 'Painel', to: routsNameMain.home },
    { label: 'Promoções', to: routsNameMain.promotions.index },
    { label: isEdit ? 'Editar' : 'Nova' }
  ]

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size={48} className="animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 pb-20">
      <ToastContainer />

      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-sm sticky top-4 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Breadcrumbs items={items} />
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {isEdit
                  ? `Editar promoção ${form.code}`
                  : 'Criar nova promoção'}
              </h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm ml-11">
              {isEdit
                ? 'Altere as configurações da campanha promocional ativa.'
                : 'Configure as regras, limites e elegibilidade para uma nova campanha.'}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto ml-11">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl font-medium text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 focus:ring-2 focus:ring-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/40 hover:-translate-y-0.5 text-white font-medium text-sm px-6 py-2.5 rounded-xl shadow-sm shadow-primary-500/30 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              {submitting ? (
                <Spinner size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isEdit ? 'Atualizar Promoção' : 'Criar Promoção'}
            </button>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 xl:grid-cols-12 gap-8 px-2"
      >
        {/* COLUNA ESQUERDA - DADOS BASE */}
        <div className="xl:col-span-7 flex flex-col gap-8">
          <Section
            title="Dados Base"
            description="Configurações principais da promoção"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Código" required className="md:col-span-2">
                <input
                  type="text"
                  value={form.code}
                  disabled={isEdit}
                  onChange={e =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  maxLength={20}
                  required
                  className={`${inputClasses} font-mono tracking-wider text-lg uppercase`}
                  placeholder="EX: BEMVINDO2024"
                />
              </Field>

              <Field label="Tipo" required>
                <select
                  value={form.type}
                  onChange={e =>
                    setForm({ ...form, type: e.target.value as PromotionType })
                  }
                  className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5.5%207.5L10%2012L14.5%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat pr-10`}
                >
                  <option value="percentage">Percentagem</option>
                  <option value="fixed">Valor fixo</option>
                  <option value="free_ride">Ride grátis</option>
                </select>
              </Field>

              <Field
                label={
                  form.type === 'percentage'
                    ? 'Valor do desconto (%)'
                    : 'Valor do desconto (AOA)'
                }
                required
              >
                <div className="relative">
                  <input
                    type="number"
                    value={form.value}
                    onChange={e =>
                      setForm({ ...form, value: Number(e.target.value) })
                    }
                    className={`${inputClasses} pl-10`}
                    disabled={form.type === 'free_ride'}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none pointer-events-none">
                    {form.type === 'percentage' ? '%' : 'Kz'}
                  </span>
                </div>
              </Field>

              <Field label="Desconto máximo (AOA)">
                <input
                  type="number"
                  value={form.max_discount}
                  onChange={e =>
                    setForm({ ...form, max_discount: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="Sem limite"
                />
              </Field>

              <Field label="Valor mínimo da ride (AOA)">
                <input
                  type="number"
                  value={form.min_ride_value}
                  onChange={e =>
                    setForm({ ...form, min_ride_value: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="Nenhum"
                />
              </Field>
            </div>

            <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-2"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Limite total de usos">
                <input
                  type="number"
                  value={form.usage_limit_total}
                  onChange={e =>
                    setForm({ ...form, usage_limit_total: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="Ilimitado"
                />
              </Field>
              <Field label="Limite por utilizador">
                <input
                  type="number"
                  value={form.usage_limit_per_user}
                  onChange={e =>
                    setForm({ ...form, usage_limit_per_user: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="Ilimitado"
                />
              </Field>

              <Field label="Data de Início" required>
                <input
                  type="date"
                  value={form.valid_from}
                  onChange={e =>
                    setForm({ ...form, valid_from: e.target.value })
                  }
                  required
                  className={inputClasses}
                />
              </Field>
              <Field label="Data de Fim" required>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={e =>
                    setForm({ ...form, valid_until: e.target.value })
                  }
                  required
                  className={inputClasses}
                />
              </Field>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Status da Promoção
                </p>
                <p className="text-sm text-gray-500">
                  Defina se a promoção está ativa no momento
                </p>
              </div>
              <ToggleSwitch
                checked={form.active}
                onChange={v => setForm({ ...form, active: v })}
              />
            </div>
          </Section>

          <Section
            title="Programa de Referência"
            description="Configurações de recompensa para indicações"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  Ativar programa de referência
                </span>
                <ToggleSwitch
                  checked={form.referral_enabled}
                  onChange={v => setForm({ ...form, referral_enabled: v })}
                />
              </div>

              {form.referral_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2 animate-in fade-in slide-in-from-top-2">
                  <Field
                    label="ID do Utilizador Proprietário (Owner)"
                    required
                    className="md:col-span-2"
                  >
                    <input
                      type="text"
                      value={form.referral_owner_user_id}
                      onChange={e =>
                        setForm({
                          ...form,
                          referral_owner_user_id: e.target.value
                        })
                      }
                      className={`${inputClasses} font-mono text-sm`}
                      placeholder="Ex: firebase-uid-xyz"
                    />
                  </Field>

                  <Field label="Tipo de recompensa">
                    <select
                      value={form.referral_reward_type}
                      onChange={e =>
                        setForm({
                          ...form,
                          referral_reward_type: e.target.value as
                            | 'fixed'
                            | 'percentage'
                        })
                      }
                      className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5.5%207.5L10%2012L14.5%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat pr-10`}
                    >
                      <option value="fixed">Valor fixo (AOA)</option>
                      <option value="percentage">
                        Percentagem do valor líquido
                      </option>
                    </select>
                  </Field>

                  <Field
                    label={
                      form.referral_reward_type === 'fixed'
                        ? 'Valor da Recompensa (AOA)'
                        : 'Percentagem da Recompensa (%)'
                    }
                  >
                    <input
                      type="number"
                      value={form.referral_reward_value}
                      onChange={e =>
                        setForm({
                          ...form,
                          referral_reward_value: Number(e.target.value)
                        })
                      }
                      className={inputClasses}
                    />
                  </Field>
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* COLUNA DIREITA - REGRAS E ELEGIBILIDADE */}
        <div className="xl:col-span-5 flex flex-col gap-8">
          <Section
            title="Regras de Elegibilidade"
            description="Condições para utilização da promoção"
          >
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div className="pr-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    Apenas novos utilizadores
                  </p>
                  <p className="text-sm text-gray-500">
                    Exclusivo para utilizadores com 0 rides concluídas
                  </p>
                </div>
                <ToggleSwitch
                  checked={form.new_users_only}
                  onChange={v => setForm({ ...form, new_users_only: v })}
                />
              </div>

              <Field label="Mínimo de dias de inatividade">
                <div className="relative">
                  <input
                    type="number"
                    value={form.inactive_days}
                    onChange={e =>
                      setForm({ ...form, inactive_days: e.target.value })
                    }
                    className={`${inputClasses} pr-12`}
                    placeholder="Ex: 30"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium pointer-events-none">
                    dias
                  </span>
                </div>
              </Field>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                  Tipos de veículo permitidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {RIDE_TYPES.map(t => {
                    const checked = form.ride_types.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            ride_types: checked
                              ? form.ride_types.filter(x => x !== t)
                              : [...form.ride_types, t]
                          })
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-95 ${
                          checked
                            ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm hover:bg-primary-100 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/50'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:hover:text-gray-200'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                  Métodos de pagamento permitidos
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(m => {
                    const checked = form.payment_methods.includes(m)
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            payment_methods: checked
                              ? form.payment_methods.filter(x => x !== m)
                              : [...form.payment_methods, m]
                          })
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-95 ${
                          checked
                            ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm hover:bg-primary-100 dark:bg-primary-900/30 dark:border-primary-800 dark:text-primary-400 dark:hover:bg-primary-900/50'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:hover:text-gray-200'
                        }`}
                      >
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="h-px w-full bg-gray-100 dark:bg-gray-800 my-1"></div>

              <Field label="Cidades de origem (separadas por vírgula)">
                <input
                  type="text"
                  value={form.origin_cities}
                  onChange={e =>
                    setForm({ ...form, origin_cities: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="Ex: luanda, viana, talatona"
                />
              </Field>

              <Field label="Cidades de destino (separadas por vírgula)">
                <input
                  type="text"
                  value={form.destination_cities}
                  onChange={e =>
                    setForm({ ...form, destination_cities: e.target.value })
                  }
                  className={inputClasses}
                  placeholder="Ex: luanda, kilamba"
                />
              </Field>

              <Field label="Regra de correspondência de cidades">
                <select
                  value={form.cities_match}
                  onChange={e =>
                    setForm({
                      ...form,
                      cities_match: e.target.value as 'both' | 'any'
                    })
                  }
                  className={`${inputClasses} appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5.5%207.5L10%2012L14.5%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_12px_center] bg-no-repeat pr-10`}
                >
                  <option value="both">
                    Obrigatório Ambas (Origem E Destino)
                  </option>
                  <option value="any">Apenas Uma (Origem OU Destino)</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section
            title="Público Alvo Específico"
            description="Restringir a lista a utilizadores específicos"
          >
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">
                  Limitar utilizadores
                </span>
                <ToggleSwitch
                  checked={form.has_specific_users}
                  onChange={v => setForm({ ...form, has_specific_users: v })}
                />
              </div>

              {form.has_specific_users && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-2">
                  <Field label="Cole os IDs (separados por vírgula, espaço ou linha)">
                    <textarea
                      value={csvText}
                      onChange={e => setCsvText(e.target.value)}
                      rows={5}
                      className={`${inputClasses} font-mono text-sm resize-y min-h-[120px]`}
                      placeholder="uid1, uid2, uid3..."
                    />
                  </Field>
                  {csvText.trim() && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium">
                      {parseCsvIds(csvText).length} utilizador(es)
                      identificado(s).
                    </p>
                  )}
                </div>
              )}
            </div>
          </Section>
        </div>
      </form>
    </div>
  )
}

// ==========================================
// COMPONENTES LOCAIS (MINI DESIGN SYSTEM)
// ==========================================

function Section({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800/80 p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  className = '',
  children
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-semibold text-gray-900 dark:text-gray-200 ml-1">
        {label}
        {required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </label>
      {children}
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
        checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
