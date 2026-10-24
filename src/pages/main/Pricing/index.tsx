import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Pencil,
  Plus,
  SlidersHorizontal
} from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import {
  useAdminRegionsViewModel,
  usePricingProfilesViewModel
} from '@/viewModels/PricingViewModel'
import {
  PRICING_SERVICES,
  buildRegionSummaries,
  buildServiceComparison,
  groupRegionSummaries,
  orphanProfiles,
  serviceKey,
  summariseAll,
  type PricingService,
  type RegionServiceCell,
  type RegionSummary
} from '@/utils/pricingByRegion'
import {
  RIDE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import type { RateBandInterface } from '@rafaelpilartes/kandengue-shared/interfaces'

/**
 * Prices, grouped by province.
 *
 * ⚠️ **The grouping is presentation only.** A profile is still one document
 * per region × ride × vehicle, written by the API — decided on 2026-10-23.
 * The arranging and counting live in `utils/pricingByRegion.ts`, which is
 * pure and has tests; this file is the markup.
 *
 * Which of the three views is on screen comes from the URL, not from state:
 * `?region=` opens one province, `?service=` compares one service across all
 * of them, neither shows the province list. That is what makes a province
 * shareable as a link and the browser's back button work.
 */

/** The human name of an operating area. */
const GROUP_LABELS: Record<string, string> = {
  'grande-luanda': 'Grande Luanda'
}

function groupLabel(key: string): string {
  return (
    GROUP_LABELS[key] ??
    // A group that nobody has named yet still reads better than its key.
    key.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())
  )
}

function serviceLabel(service: PricingService): string {
  return `${RIDE_TYPE_LABELS[service.ride_type]} · ${VEHICLE_TYPE_LABELS[service.vehicle_type]}`
}

function bandSummary(band: RateBandInterface): string {
  return `${band.start_time}–${band.end_time}: ${band.base_fare} + ${band.price_per_km}/km`
}

function StateBadge({ cell }: { cell: RegionServiceCell }) {
  if (!cell.profile) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
        Sem perfil
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        cell.active
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      }`}
    >
      {cell.active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function ReviewBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
      <AlertTriangle size={12} aria-hidden /> Preços por rever
    </span>
  )
}

/** The edit or create link of one service of one province. */
function CellAction({
  regionCode,
  cell
}: {
  regionCode: string
  cell: RegionServiceCell
}) {
  if (cell.profile) {
    return (
      <Link
        to={`${routsNameMain.pricing.profileEditStr}${cell.profile.id}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary-200 hover:underline"
      >
        <Pencil size={12} aria-hidden /> Editar
      </Link>
    )
  }

  // The region travels in the query string: without it the form opens on
  // `DEFAULT_REGION` and a profile for Benguela would quietly be created for
  // Luanda — the one mistake this screen exists to prevent.
  return (
    <Link
      to={`${routsNameMain.pricing.profileCreate}?region=${encodeURIComponent(regionCode)}&ride=${cell.ride_type}&vehicle=${cell.vehicle_type}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary-200"
    >
      <Plus size={12} aria-hidden /> Criar perfil
    </Link>
  )
}

function ProvisionalBadge() {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
      title="Código atribuído por nós: a ISO 3166-2:AO ainda não reflecte a divisão de 2024"
    >
      Código provisório
    </span>
  )
}

export function PricingProfilesPage() {
  const [search, setSearch] = useSearchParams()
  const { profiles, loading: loadingProfiles } = usePricingProfilesViewModel()
  const {
    regions,
    loading: loadingRegions,
    error: regionsError
  } = useAdminRegionsViewModel()

  const loading = loadingProfiles || loadingRegions

  const summaries = useMemo(
    () => buildRegionSummaries(regions, profiles),
    [regions, profiles]
  )
  const groups = useMemo(() => groupRegionSummaries(summaries), [summaries])
  const totals = useMemo(() => summariseAll(summaries), [summaries])
  const orphans = useMemo(
    () => orphanProfiles(regions, profiles),
    [regions, profiles]
  )

  const selectedRegionCode = search.get('region')
  const selectedServiceKey = search.get('service')

  const selectedRegion: RegionSummary | null = useMemo(
    () =>
      selectedRegionCode
        ? (summaries.find(s => s.region.code === selectedRegionCode) ?? null)
        : null,
    [summaries, selectedRegionCode]
  )

  const selectedService = useMemo(
    () =>
      selectedServiceKey
        ? (PRICING_SERVICES.find(s => serviceKey(s) === selectedServiceKey) ??
          null)
        : null,
    [selectedServiceKey]
  )

  const comparison = useMemo(
    () =>
      selectedService ? buildServiceComparison(summaries, selectedService) : [],
    [summaries, selectedService]
  )

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(search)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearch(next)
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Preços' },
              ...(selectedRegion
                ? [
                    {
                      label: 'Perfis de preço',
                      to: routsNameMain.pricing.profiles
                    },
                    { label: selectedRegion.region.name }
                  ]
                : [{ label: 'Perfis de preço' }])
            ]}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {selectedRegion
              ? `Preços — ${selectedRegion.region.name}`
              : 'Perfis de preço'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedRegion
              ? 'Um perfil por serviço. Só os activos entram na cotação desta província.'
              : 'A região de uma corrida é a província da recolha. Cada província tem os seus perfis, e só os activos entram na cotação.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={routsNameMain.pricing.rules}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <SlidersHorizontal size={16} aria-hidden /> Regras de acréscimo
          </Link>
          <Link
            to={routsNameMain.pricing.profileCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-200 text-white text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} aria-hidden /> Novo perfil
          </Link>
        </div>
      </div>

      {regionsError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          Não foi possível carregar as províncias:{' '}
          {(regionsError as Error).message}. Sem elas não há como agrupar os
          preços — os perfis continuam a existir.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} className="animate-spin text-primary-200" />
        </div>
      ) : (
        <>
          {/* Totals, so the state of the 21 is one glance and not a count */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Províncias', value: totals.regions },
              {
                label: 'Com serviço activo',
                value: totals.regionsWithActive
              },
              { label: 'Serviços activos', value: totals.active },
              {
                label: 'Preços por rever',
                value: totals.needsReview,
                warn: totals.needsReview > 0
              }
            ].map(item => (
              <div
                key={item.label}
                className={`p-4 rounded-xl border ${
                  item.warn
                    ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50'
                    : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {item.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* The service filter: the only view that sees across provinces */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
            <label
              htmlFor="service-filter"
              className="text-sm font-medium text-gray-700 dark:text-gray-200 shrink-0"
            >
              Comparar um serviço entre províncias
            </label>
            <select
              id="service-filter"
              value={selectedServiceKey ?? ''}
              onChange={e => setParam('service', e.target.value || null)}
              className="w-full md:w-auto px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm outline-none focus:border-primary-500"
            >
              <option value="">Nenhum — ver por província</option>
              {PRICING_SERVICES.map(service => (
                <option key={serviceKey(service)} value={serviceKey(service)}>
                  {serviceLabel(service)}
                </option>
              ))}
            </select>
            {selectedService && (
              <button
                type="button"
                onClick={() => setParam('service', null)}
                className="text-xs font-medium text-gray-500 hover:text-primary-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* ── The comparison across provinces ───────────────────────────── */}
          {selectedService ? (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
              <table className="min-w-full text-sm">
                <caption className="sr-only">
                  {serviceLabel(selectedService)} em cada província
                </caption>
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3">Província</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Faixas</th>
                    <th className="px-4 py-3">Mínimo</th>
                    <th className="px-4 py-3">Versão</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(({ region, cell }) => (
                    <tr
                      key={region.code}
                      className="border-b border-gray-50 dark:border-gray-700/60 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {region.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-gray-400">
                            {region.code}
                          </span>
                          {region.group && (
                            <span className="text-xs text-gray-400">
                              {groupLabel(region.group)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <StateBadge cell={cell} />
                          {cell.needsReview && <ReviewBadge />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                        {cell.profile ? (
                          <div className="flex flex-col">
                            {cell.profile.rate_bands.map(band => (
                              <span key={`${band.start_time}-${band.end_time}`}>
                                {bandSummary(band)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {cell.profile ? `${cell.profile.min_fare} Kz` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {cell.profile ? `v${cell.profile.version}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <CellAction regionCode={region.code} cell={cell} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedRegion ? (
            /* ── One province: its services ─────────────────────────────── */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={routsNameMain.pricing.profiles}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300"
                >
                  <ArrowLeft size={16} aria-hidden /> Todas as províncias
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">
                    {selectedRegion.region.code}
                  </span>
                  {selectedRegion.region.provisional && <ProvisionalBadge />}
                </div>
              </div>

              {selectedRegion.region.group && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-sm text-blue-900 dark:text-blue-200">
                  <strong>
                    Área de operação: {groupLabel(selectedRegion.region.group)}
                  </strong>
                  <p className="text-xs mt-1 text-blue-800 dark:text-blue-300">
                    Uma corrida pode terminar em qualquer província desta área
                    de operação. Os preços, esses, vêm sempre do perfil da
                    província onde a corrida é <strong>recolhida</strong>.
                  </p>
                </div>
              )}

              <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-4 py-3">Serviço</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Faixas</th>
                      <th className="px-4 py-3">Mínimo</th>
                      <th className="px-4 py-3">Repartição</th>
                      <th className="px-4 py-3">Versão</th>
                      <th className="px-4 py-3">Actualizado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRegion.cells.map(cell => (
                      <tr
                        key={serviceKey(cell)}
                        className="border-b border-gray-50 dark:border-gray-700/60 last:border-0"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {serviceLabel(cell)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1.5">
                            <StateBadge cell={cell} />
                            {cell.needsReview && <ReviewBadge />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                          {cell.profile ? (
                            <div className="flex flex-col">
                              {cell.profile.rate_bands.map(band => (
                                <span
                                  key={`${band.start_time}-${band.end_time}`}
                                >
                                  {bandSummary(band)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {cell.profile ? `${cell.profile.min_fare} Kz` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {cell.profile
                            ? `${cell.profile.payouts.driver_percent}/${cell.profile.payouts.company_percent}/${cell.profile.payouts.pension_fund_percent}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {cell.profile ? `v${cell.profile.version}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {cell.profile?.updated_at
                            ? cell.profile.updated_at.toLocaleString('pt-PT')
                            : '—'}
                          {cell.profile?.updated_by
                            ? ` · ${cell.profile.updated_by}`
                            : ''}
                        </td>
                        <td className="px-4 py-3">
                          <CellAction
                            regionCode={selectedRegion.region.code}
                            cell={cell}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── The province list, by operating area ───────────────────── */
            <div className="flex flex-col gap-4">
              {summaries.length === 0 && (
                <div className="p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-500 text-center">
                  Não há províncias na tabela. Sem elas a cotação recusa tudo —
                  é o script <span className="font-mono">seed-regions</span> que
                  as cria.
                </div>
              )}

              {groups.map(group => {
                const isArea = group.key !== null && group.members.length > 1

                return (
                  <section
                    key={group.key ?? group.members[0]?.region.code}
                    className={
                      isArea
                        ? 'rounded-xl border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-900/10 p-3 flex flex-col gap-2'
                        : 'flex flex-col'
                    }
                  >
                    {isArea && (
                      <header className="px-2 pt-1">
                        <h2 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                          Área de operação: {groupLabel(group.key as string)}
                        </h2>
                        <p className="text-xs text-blue-800 dark:text-blue-300">
                          Estas províncias contam como uma só para o destino de
                          uma corrida — é o que torna o aeroporto de Luanda
                          servível, por ficar em Icolo e Bengo. Os preços
                          continuam a ser os da província da recolha.
                        </p>
                      </header>
                    )}

                    <div className="flex flex-col gap-2">
                      {group.members.map(summary => (
                        <Link
                          key={summary.region.code}
                          to={`${routsNameMain.pricing.profiles}?region=${encodeURIComponent(summary.region.code)}`}
                          className="group flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-200 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {summary.region.name}
                              </span>
                              <span className="font-mono text-xs text-gray-400">
                                {summary.region.code}
                              </span>
                              {summary.region.provisional && (
                                <ProvisionalBadge />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {summary.activeCount} de {summary.cells.length}{' '}
                              serviços activos
                              {summary.missingCount > 0 &&
                                ` · ${summary.missingCount} sem perfil`}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {summary.needsReviewCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                <AlertTriangle size={12} aria-hidden />
                                {summary.needsReviewCount} por rever
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                summary.activeCount > 0
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {summary.activeCount > 0
                                ? 'Em serviço'
                                : 'Sem serviço'}
                            </span>
                            <ChevronRight
                              size={16}
                              className="text-gray-300 group-hover:text-primary-200"
                              aria-hidden
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )
              })}

              {/*
               * Profiles under a code the province table does not know. Normally
               * empty — but a price that is invisible is how one nobody meant to
               * leave live stays live.
               */}
              {orphans.length > 0 && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                    {orphans.length} perfil(s) numa região que não está na
                    tabela das províncias
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Não aparecem em nenhuma província acima. Ou o código está
                    errado no perfil, ou falta a província na tabela.
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {orphans.map(profile => (
                      <li key={profile.id} className="text-xs">
                        <Link
                          to={`${routsNameMain.pricing.profileEditStr}${profile.id}`}
                          className="font-mono text-red-800 dark:text-red-200 hover:underline"
                        >
                          {profile.id}
                        </Link>
                        <span className="text-red-700 dark:text-red-300">
                          {' '}
                          · {profile.active ? 'activo' : 'inactivo'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
