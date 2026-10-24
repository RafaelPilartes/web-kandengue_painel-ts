import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { AppModal } from '@/components/modal/AppModal'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { usePricingProfilesViewModel } from '@/viewModels/PricingViewModel'
import type {
  PricingProfileInput,
  PricingProfileView
} from '@/core/interfaces/IPricingRepository'
import { showToast } from '@/utils/toasts'
import {
  DEFAULT_DISCOUNT_DRIVER_SHARE_PERCENT,
  DEFAULT_MIN_FINAL_FARE_PERCENT,
  DEFAULT_REGION,
  RIDE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import {
  RIDE_TYPES,
  type RideType,
  type VehicleType
} from '@rafaelpilartes/kandengue-shared/enums'
import {
  pricingProfileId,
  validatePricingProfile,
  vehicleTypesForRide
} from '@rafaelpilartes/kandengue-shared/functions'
import type { RateBandInterface } from '@rafaelpilartes/kandengue-shared/interfaces'

// A validação é a da lib, a correr no browser antes de gravar — as faixas a
// cobrir as 24 h sem sobreposição, os payouts a somar 100, a combinação
// corrida × veículo a existir. A API corre-a outra vez ao gravar.

const inputClasses =
  'w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none shadow-sm disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed'

// As faixas de produção das entregas, como ponto de partida de um perfil novo.
const DEFAULT_BANDS: RateBandInterface[] = [
  { start_time: '06:30', end_time: '17:31', base_fare: 750, price_per_km: 200, price_per_minute: 50, wait_time_free_minutes: 5 },
  { start_time: '17:31', end_time: '06:30', base_fare: 1000, price_per_km: 250, price_per_minute: 75, wait_time_free_minutes: 5 }
]

type FormState = {
  region: string
  ride_type: RideType
  vehicle_type: VehicleType
  rate_bands: RateBandInterface[]
  min_fare: number
  insurance_percent: number
  driver_percent: number
  company_percent: number
  pension_fund_percent: number
  max_surcharge_percent: number
  min_final_fare_percent: number
  discount_driver_share_percent: number
  utc_offset_minutes: number
  active: boolean
  note: string
}

const emptyState: FormState = {
  region: DEFAULT_REGION,
  ride_type: 'delivery',
  vehicle_type: 'motorcycle',
  rate_bands: DEFAULT_BANDS,
  min_fare: 0,
  insurance_percent: 5,
  driver_percent: 80,
  company_percent: 15,
  pension_fund_percent: 5,
  max_surcharge_percent: 100,
  min_final_fare_percent: DEFAULT_MIN_FINAL_FARE_PERCENT,
  discount_driver_share_percent: DEFAULT_DISCOUNT_DRIVER_SHARE_PERCENT,
  utc_offset_minutes: 60,
  active: false,
  note: ''
}

function profileToForm(p: PricingProfileView): FormState {
  return {
    region: p.region,
    ride_type: p.ride_type,
    vehicle_type: p.vehicle_type,
    rate_bands: p.rate_bands,
    min_fare: p.min_fare,
    insurance_percent: p.insurance_percent,
    driver_percent: p.payouts.driver_percent,
    company_percent: p.payouts.company_percent,
    pension_fund_percent: p.payouts.pension_fund_percent,
    max_surcharge_percent: p.max_surcharge_percent,
    min_final_fare_percent: p.min_final_fare_percent ?? DEFAULT_MIN_FINAL_FARE_PERCENT,
    discount_driver_share_percent:
      p.discount_driver_share_percent ?? DEFAULT_DISCOUNT_DRIVER_SHARE_PERCENT,
    utc_offset_minutes: p.utc_offset_minutes,
    active: p.active,
    note: ''
  }
}

function formToInput(form: FormState): PricingProfileInput {
  return {
    region: form.region.trim(),
    ride_type: form.ride_type,
    vehicle_type: form.vehicle_type,
    rate_bands: form.rate_bands,
    min_fare: Number(form.min_fare),
    insurance_percent: Number(form.insurance_percent),
    payouts: {
      driver_percent: Number(form.driver_percent),
      company_percent: Number(form.company_percent),
      pension_fund_percent: Number(form.pension_fund_percent)
    },
    max_surcharge_percent: Number(form.max_surcharge_percent),
    min_final_fare_percent: Number(form.min_final_fare_percent),
    discount_driver_share_percent: Number(form.discount_driver_share_percent),
    utc_offset_minutes: Number(form.utc_offset_minutes),
    active: form.active,
    note: form.note.trim() || undefined
  }
}

function Field({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export function PricingProfileFormPage() {
  const navigate = useNavigate()
  const { profileId } = useParams<{ profileId: string }>()
  const [search] = useSearchParams()
  const isEdit = !!profileId

  const { profiles, loading, saveProfile } = usePricingProfilesViewModel()
  const [form, setForm] = useState<FormState>(() => {
    const ride = search.get('ride') as RideType | null
    const vehicle = search.get('vehicle') as VehicleType | null
    const rideType = ride && RIDE_TYPES.includes(ride) ? ride : emptyState.ride_type
    const allowed = vehicleTypesForRide(rideType)
    /*
     * ⚠️ The province comes from the link that opened this form. Falling back
     * to `DEFAULT_REGION` is what the screen did when there was only one
     * region; now that there are 21, a profile created from Benguela's page
     * would silently be a profile for Luanda.
     */
    const region = search.get('region')?.trim().toUpperCase()
    return {
      ...emptyState,
      ...(region ? { region } : {}),
      ride_type: rideType,
      vehicle_type: vehicle && allowed.includes(vehicle) ? vehicle : (allowed[0] ?? 'motorcycle')
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const [confirmActivation, setConfirmActivation] = useState(false)

  const existing = useMemo(
    () => (isEdit ? profiles.find(p => p.id === profileId) ?? null : null),
    [isEdit, profiles, profileId]
  )

  useEffect(() => {
    if (existing) setForm(profileToForm(existing))
  }, [existing])

  /*
   * The seed script's mark: this profile carries Luanda's numbers and nobody
   * has looked at them for this province yet.
   *
   * ⚠️ **Nothing here clears it, and nothing should.** The API's body schema
   * is a closed `z.object`, so zod drops the field on the way in, and
   * `saveProfile` writes with `tx.set` and no merge — the saved document
   * simply no longer has it. Sending it back would be the one way to keep the
   * mark alive past a review.
   */
  const needsReview = existing?.prices_need_review === true

  /*
   * Turning a profile with unreviewed prices ON is the move that asks for a
   * confirmation: from that moment passengers are quoted those numbers.
   *
   * ⚠️ **Already-active is not an activation.** `AO-ICB_delivery_motorcycle`
   * is born active *and* marked, because it mirrors Luanda — asking to confirm
   * a save that changes nothing about its state would train whoever reads it
   * to click through.
   */
  const requiresActivationConfirm =
    needsReview && form.active && existing?.active !== true

  const allowedVehicles = vehicleTypesForRide(form.ride_type)
  const derivedId = pricingProfileId(form.region, form.ride_type, form.vehicle_type)

  // Os erros da lib, ao vivo: o admin vê o que falta antes de carregar em gravar.
  const errors = useMemo(() => {
    const { note, ...fields } = formToInput(form)
    void note // a nota é da auditoria, não do perfil
    return validatePricingProfile({ ...fields, id: derivedId, version: 0 })
  }, [form, derivedId])

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const updateBand = (index: number, patch: Partial<RateBandInterface>) =>
    setForm(prev => ({
      ...prev,
      rate_bands: prev.rate_bands.map((band, i) => (i === index ? { ...band, ...patch } : band))
    }))

  const handleRideChange = (rideType: RideType) => {
    const allowed = vehicleTypesForRide(rideType)
    setForm(prev => ({
      ...prev,
      ride_type: rideType,
      vehicle_type: allowed.includes(prev.vehicle_type) ? prev.vehicle_type : (allowed[0] ?? prev.vehicle_type)
    }))
  }

  const performSave = async () => {
    setSubmitting(true)
    try {
      const saved = await saveProfile.mutateAsync(formToInput(form))
      showToast('success', `Perfil ${saved.id} gravado (v${saved.version})`)
      navigate(routsNameMain.pricing.profiles)
    } catch (err) {
      showToast('error', (err as Error).message || 'Não foi possível gravar o perfil')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (errors.length > 0) {
      showToast('error', 'O perfil tem erros. Corrige-os antes de gravar.')
      return
    }
    if (requiresActivationConfirm) {
      setConfirmActivation(true)
      return
    }
    void performSave()
  }

  if (isEdit && loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={28} className="animate-spin text-primary-200" />
      </div>
    )
  }

  if (isEdit && !loading && !existing) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-gray-600">Perfil {profileId} não encontrado.</p>
        <Link to={routsNameMain.pricing.profiles} className="text-primary-200 hover:underline">
          Voltar aos perfis
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Preços' },
              { label: 'Perfis de preço', to: routsNameMain.pricing.profiles },
              { label: isEdit ? 'Editar' : 'Novo' }
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isEdit ? `Editar ${profileId}` : 'Novo perfil de preço'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{derivedId}</p>
        </div>
        <Link
          to={routsNameMain.pricing.profiles}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
      </div>

      {needsReview && (
        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 flex flex-row items-start gap-2">
          <AlertTriangle
            size={16}
            className="mt-0.5 text-orange-600 dark:text-orange-400 shrink-0"
            aria-hidden
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-orange-900 dark:text-orange-200">
              Preços por rever
            </span>
            <span className="text-xs text-orange-800 dark:text-orange-300">
              Este perfil foi criado automaticamente com os valores de Luanda e
              ninguém os confirmou para esta província. Ao gravar, a marca
              desaparece — grava só depois de olhar para os números.
            </span>
          </div>
        </div>
      )}

      {/* Identidade */}
      <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Região" hint="Código ISO 3166-2:AO, ex.: AO-LUA">
          <input
            className={inputClasses}
            value={form.region}
            disabled={isEdit}
            onChange={e => update('region', e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Tipo de corrida">
          <select
            className={inputClasses}
            value={form.ride_type}
            disabled={isEdit}
            onChange={e => handleRideChange(e.target.value as RideType)}
          >
            {RIDE_TYPES.map(t => (
              <option key={t} value={t}>
                {RIDE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Veículo" hint="Só as combinações válidas">
          <select
            className={inputClasses}
            value={form.vehicle_type}
            disabled={isEdit}
            onChange={e => update('vehicle_type', e.target.value as VehicleType)}
          >
            {allowedVehicles.map(v => (
              <option key={v} value={v}>
                {VEHICLE_TYPE_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado" hint="Só os activos entram na cotação">
          <label className="inline-flex items-center gap-2 py-2 text-sm text-gray-800 dark:text-gray-100">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => update('active', e.target.checked)}
            />
            {form.active ? 'Activo' : 'Inactivo'}
          </label>
        </Field>
      </section>

      {/* Faixas horárias */}
      <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Faixas horárias
          </h2>
          <button
            type="button"
            onClick={() =>
              update('rate_bands', [
                ...form.rate_bands,
                { start_time: '00:00', end_time: '00:00', base_fare: 0, price_per_km: 0, price_per_minute: 0, wait_time_free_minutes: 0 }
              ])
            }
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-200 hover:underline"
          >
            <Plus size={14} /> Acrescentar faixa
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Têm de cobrir as 24 h sem sobreposição; o fim é exclusivo e pode
          passar a meia-noite (17:31 → 06:30).
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-2 py-2">Início</th>
                <th className="px-2 py-2">Fim</th>
                <th className="px-2 py-2">Base (Kz)</th>
                <th className="px-2 py-2">Por km</th>
                <th className="px-2 py-2">Por min. espera</th>
                <th className="px-2 py-2">Min. grátis</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {form.rate_bands.map((band, i) => (
                <tr key={`${i}-${band.start_time}`}>
                  <td className="px-2 py-1">
                    <input className={inputClasses} value={band.start_time} onChange={e => updateBand(i, { start_time: e.target.value })} placeholder="HH:mm" />
                  </td>
                  <td className="px-2 py-1">
                    <input className={inputClasses} value={band.end_time} onChange={e => updateBand(i, { end_time: e.target.value })} placeholder="HH:mm" />
                  </td>
                  <td className="px-2 py-1">
                    <input className={inputClasses} type="number" min={0} value={band.base_fare} onChange={e => updateBand(i, { base_fare: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1">
                    <input className={inputClasses} type="number" min={0} value={band.price_per_km} onChange={e => updateBand(i, { price_per_km: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1">
                    <input className={inputClasses} type="number" min={0} value={band.price_per_minute} onChange={e => updateBand(i, { price_per_minute: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1">
                    <input className={inputClasses} type="number" min={0} value={band.wait_time_free_minutes} onChange={e => updateBand(i, { wait_time_free_minutes: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      type="button"
                      aria-label="Remover faixa"
                      disabled={form.rate_bands.length <= 1}
                      onClick={() => update('rate_bands', form.rate_bands.filter((_, j) => j !== i))}
                      className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mínimo, seguro, repartição, tecto, 75% e 30/70 */}
      <section className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Tarifa mínima (Kz)" hint="0 = sem mínimo">
          <input className={inputClasses} type="number" min={0} value={form.min_fare} onChange={e => update('min_fare', Number(e.target.value))} />
        </Field>
        <Field label="Seguro (%)" hint="Cobrado por cima do subtotal; não se reparte">
          <input className={inputClasses} type="number" min={0} max={100} step="0.1" value={form.insurance_percent} onChange={e => update('insurance_percent', Number(e.target.value))} />
        </Field>
        <Field label="Tecto do acréscimo (%)" hint="Do custo base + distância">
          <input className={inputClasses} type="number" min={0} value={form.max_surcharge_percent} onChange={e => update('max_surcharge_percent', Number(e.target.value))} />
        </Field>
        <Field label="Fuso (min. de UTC)" hint="Angola: 60">
          <input className={inputClasses} type="number" value={form.utc_offset_minutes} onChange={e => update('utc_offset_minutes', Number(e.target.value))} />
        </Field>
        <Field label="Motorista (%)">
          <input className={inputClasses} type="number" min={0} max={100} step="0.1" value={form.driver_percent} onChange={e => update('driver_percent', Number(e.target.value))} />
        </Field>
        <Field label="Empresa (%)">
          <input className={inputClasses} type="number" min={0} max={100} step="0.1" value={form.company_percent} onChange={e => update('company_percent', Number(e.target.value))} />
        </Field>
        <Field label="Fundo de pensões (%)" hint="Os três somam 100">
          <input className={inputClasses} type="number" min={0} max={100} step="0.1" value={form.pension_fund_percent} onChange={e => update('pension_fund_percent', Number(e.target.value))} />
        </Field>
        <div />
        <Field label="Limite inferior no fecho (%)" hint="O subtotal com a distância real não desce abaixo desta % do cotado">
          <input className={inputClasses} type="number" min={0} max={100} value={form.min_final_fare_percent} onChange={e => update('min_final_fare_percent', Number(e.target.value))} />
        </Field>
        <Field label="Desconto que sai do motorista (%)" hint="O resto sai da empresa; o fundo nunca absorve">
          <input className={inputClasses} type="number" min={0} max={100} value={form.discount_driver_share_percent} onChange={e => update('discount_driver_share_percent', Number(e.target.value))} />
        </Field>
        <Field label="Nota para a auditoria" hint="Opcional">
          <input className={inputClasses} value={form.note} onChange={e => update('note', e.target.value)} maxLength={300} />
        </Field>
      </section>

      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
          <p className="font-semibold mb-1">A validação da lib recusa este perfil:</p>
          <ul className="list-disc pl-5">
            {errors.map(e => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Link
          to={routsNameMain.pricing.profiles}
          className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={submitting || errors.length > 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-200 text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? <Spinner size={16} className="animate-spin" /> : <Save size={16} />}
          Gravar perfil
        </button>
      </div>

      {/*
       * Activating a profile whose prices nobody reviewed is the one action on
       * this screen that cannot be undone by editing: from the moment it is
       * saved, passengers in this province are quoted these numbers. It asks
       * out loud.
       */}
      <AppModal
        isOpen={confirmActivation}
        onClose={() => setConfirmActivation(false)}
        title="Activar com preços por rever?"
        size="md"
        variant="center"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmActivation(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setConfirmActivation(false)
                void performSave()
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? (
                <Spinner size={16} className="animate-spin" />
              ) : (
                <AlertTriangle size={16} aria-hidden />
              )}
              Sim, activar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3 text-sm text-gray-700 dark:text-gray-200">
          <p>
            O perfil{' '}
            <span className="font-mono font-semibold">{derivedId}</span> está
            marcado como <strong>preços por rever</strong>: foi criado
            automaticamente com os valores de Luanda e ninguém os confirmou
            para esta província.
          </p>
          <p>
            Ao activar, estes preços passam a ser os que os passageiros desta
            província vêem nas cotações — <strong>imediatamente</strong>.
          </p>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 flex flex-col gap-1 text-xs">
            <span>
              <span className="text-gray-500 dark:text-gray-400">Região:</span>{' '}
              <span className="font-mono">{form.region}</span>
            </span>
            <span>
              <span className="text-gray-500 dark:text-gray-400">Serviço:</span>{' '}
              {RIDE_TYPE_LABELS[form.ride_type]} ·{' '}
              {VEHICLE_TYPE_LABELS[form.vehicle_type]}
            </span>
            <span>
              <span className="text-gray-500 dark:text-gray-400">
                Tarifa mínima:
              </span>{' '}
              {form.min_fare} Kz
            </span>
            {form.rate_bands.map(band => (
              <span key={`${band.start_time}-${band.end_time}`}>
                <span className="text-gray-500 dark:text-gray-400">
                  {band.start_time}–{band.end_time}:
                </span>{' '}
                {band.base_fare} Kz + {band.price_per_km}/km
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            A marca de "preços por rever" sai com esta gravação, e a alteração
            fica registada com o teu nome.
          </p>
        </div>
      </AppModal>
    </form>
  )
}
