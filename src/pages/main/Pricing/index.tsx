import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, SlidersHorizontal } from 'lucide-react'
import { Spinner } from 'phosphor-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { usePricingProfilesViewModel } from '@/viewModels/PricingViewModel'
import { buildPricingMatrix } from '@/utils/pricingMatrix'
import {
  RIDE_TYPE_LABELS,
  VEHICLE_TYPE_LABELS
} from '@rafaelpilartes/kandengue-shared/constants'
import { VEHICLE_TYPES } from '@rafaelpilartes/kandengue-shared/enums'
import type {
  PricingProfileInterface,
  RateBandInterface
} from '@rafaelpilartes/kandengue-shared/interfaces'

// O preço é por corrida × veículo: uma entrega de mota e uma entrega de
// carro são dois perfis. A grelha mostra de uma vez o que está a ser
// vendido (activo), o que existe mas está parado, e o que ainda não tem
// perfil. Combinações fora da tabela da lib não ganham botão nenhum.

function bandSummary(band: RateBandInterface): string {
  return `${band.start_time}–${band.end_time}: ${band.base_fare} + ${band.price_per_km}/km`
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        active
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )
}

export function PricingProfilesPage() {
  const { profiles, loading, error } = usePricingProfilesViewModel()
  const matrix = useMemo(() => buildPricingMatrix(profiles), [profiles])

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => a.id.localeCompare(b.id)),
    [profiles]
  )

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <Breadcrumbs
            items={[{ label: 'Preços' }, { label: 'Perfis de preço' }]}
          />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            Perfis de preço
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Um perfil por tipo de corrida e veículo. Só os activos entram na
            cotação.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={routsNameMain.pricing.rules}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <SlidersHorizontal size={16} /> Regras de acréscimo
          </Link>
          <Link
            to={routsNameMain.pricing.profileCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-200 text-white text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} /> Novo perfil
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          Não foi possível carregar os perfis: {(error as Error).message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} className="animate-spin text-primary-200" />
        </div>
      ) : (
        <>
          {/* Grelha corrida × veículo */}
          <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-3">Tipo de corrida</th>
                  {VEHICLE_TYPES.map(vehicle => (
                    <th key={vehicle} className="px-4 py-3">
                      {VEHICLE_TYPE_LABELS[vehicle]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map(row => (
                  <tr
                    key={row.ride_type}
                    className="border-b border-gray-50 dark:border-gray-700/60 last:border-0"
                  >
                    <td className="px-4 py-4 font-semibold text-gray-900 dark:text-white">
                      {RIDE_TYPE_LABELS[row.ride_type]}
                    </td>
                    {row.cells.map(cell => (
                      <td
                        key={cell.vehicle_type}
                        className="px-4 py-4 align-top"
                      >
                        {!cell.valid ? (
                          <span className="text-gray-300 dark:text-gray-600">
                            — não se oferece
                          </span>
                        ) : cell.profile ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <ActiveBadge active={cell.active} />
                              <span className="text-xs text-gray-400">
                                v{cell.profile.version}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-300 flex flex-col">
                              {cell.profile.rate_bands.map(band => (
                                <span key={`${band.start_time}-${band.end_time}`}>
                                  {bandSummary(band)}
                                </span>
                              ))}
                            </div>
                            <Link
                              to={`${routsNameMain.pricing.profileEditStr}${cell.profile.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary-200 hover:underline"
                            >
                              <Pencil size={12} /> Editar
                            </Link>
                          </div>
                        ) : (
                          <Link
                            to={`${routsNameMain.pricing.profileCreate}?ride=${cell.ride_type}&vehicle=${cell.vehicle_type}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary-200"
                          >
                            <Plus size={12} /> Criar perfil
                          </Link>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista completa */}
          <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Seguro</th>
                  <th className="px-4 py-3">Repartição</th>
                  <th className="px-4 py-3">Mínimo final</th>
                  <th className="px-4 py-3">Desconto motorista</th>
                  <th className="px-4 py-3">Versão</th>
                  <th className="px-4 py-3">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {sortedProfiles.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Ainda não há perfis. Cria o primeiro na grelha acima.
                    </td>
                  </tr>
                )}
                {sortedProfiles.map((p: PricingProfileInterface) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-50 dark:border-gray-700/60 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-800 dark:text-gray-100">
                      {p.id}
                      <div className="font-sans text-gray-500">
                        {RIDE_TYPE_LABELS[p.ride_type]} ·{' '}
                        {VEHICLE_TYPE_LABELS[p.vehicle_type]}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={p.active} />
                    </td>
                    <td className="px-4 py-3">{p.insurance_percent}%</td>
                    <td className="px-4 py-3">
                      {p.payouts.driver_percent}/{p.payouts.company_percent}/
                      {p.payouts.pension_fund_percent}
                    </td>
                    <td className="px-4 py-3">
                      {p.min_final_fare_percent ?? 75}%
                    </td>
                    <td className="px-4 py-3">
                      {p.discount_driver_share_percent ?? 30}%
                    </td>
                    <td className="px-4 py-3">v{p.version}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.updated_at
                        ? p.updated_at.toLocaleString('pt-PT')
                        : '—'}
                      {p.updated_by ? ` · ${p.updated_by}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
