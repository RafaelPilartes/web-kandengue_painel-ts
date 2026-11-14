// pages/reports/RidesReports.tsx
import { useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import { formatMoney, formatKwanza } from '@/utils/number'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js'
import { rideStatusOptions, rideTypeOptions } from '@/data/selectOption'
import { SelectSearchableCustom } from '@/components/selects/SelectSearchableCustom'
import { DatePickerCustom } from '@/components/selects/DatePickerCustom'
import type {
  BreakdownType,
  PayoutsBreakdownType,
  RideFareInterface
} from '@/interfaces/IRideFare'
import { monthKey, monthLabel, rangeMonths, toDate } from '@/helpers/metrics'
import { getRideStatusLabel, getRideTypeLabel } from '@/utils/gettersLabels'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { customPickupIcon } from '@/data/customPickupIcon'
import {
  CheckCircleIcon,
  Crown,
  ShieldCheckIcon,
  XCircleIcon
} from 'lucide-react'
import { FaUserGroup } from 'react-icons/fa6'
import { CurrencyDollar } from 'phosphor-react'
import { formatDateTimeFromFirestore } from '@/utils/date'

// Registrar chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

export function MetricsPage() {
  const { rides } = useRidesViewModel(5000)

  const dateStartMonth = () => {
    const dateStar = new Date()
    dateStar.setDate(dateStar.getDate() - 30)
    return dateStar.toISOString().slice(0, 10)
  }
  const dateEndMonth = () => {
    return new Date().toISOString().slice(0, 10)
  }

  // 📌 Filtros locais
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedDateStart, setSelectedDateStart] =
    useState<string>(dateStartMonth)
  const [selectedDateEnd, setSelectedDateEnd] = useState<string>(dateEndMonth)

  const convertToDate = (dateString: string) => {
    const [day, month, year] = dateString.split('/')
    return new Date(`${year}-${month}-${day}`)
  }

  // 🔎 Filtrando
  const filteredRides = rides.filter(ride => {
    const rideDateTime = formatDateTimeFromFirestore(
      ride.created_at as any
    ).date

    // Convertendo a data da corrida para o formato "YYYY-MM-DD"
    const rideDate = convertToDate(rideDateTime)

    // Convertendo as datas de início e fim para objetos Date
    const startDate = convertToDate(selectedDateStart)
    const endDate = convertToDate(selectedDateEnd)

    const isDateInRange = rideDate >= startDate && rideDate <= endDate

    return (
      (statusFilter === 'all' || ride.status === statusFilter) &&
      (typeFilter === 'all' || ride.type === typeFilter) &&
      isDateInRange
    )
  })

  // Parse date range
  const start = useMemo(
    () => new Date(selectedDateStart + 'T00:00:00'),
    [selectedDateStart]
  )
  const end = useMemo(() => {
    const date = new Date(selectedDateEnd + 'T23:59:59')
    return date
  }, [selectedDateEnd])

  // The screen lives under "Financeiro" since 2026-10-31; the trail says so.
  const namePageReportsDetails = 'Relatórios de Corridas'

  const itemsBreadcrumbs = [
    { label: 'Início', to: routsNameMain.home },
    { label: 'Financeiro', to: routsNameMain.finance.reports.index },
    { label: namePageReportsDetails }
  ]

  // 📊 Cálculos
  /* -----------------------------
       Metrics
       ----------------------------- */
  const metrics = useMemo(() => {
    const totalRides = filteredRides.length
    let completed = 0
    let canceled = 0
    let totalRevenue = 0
    let totalDistance = 0
    let sumBaseFare = 0
    let sumDistanceCost = 0
    let sumWaitCost = 0
    let sumInsurance = 0
    let sumDiscount = 0
    let sumDriverEarnings = 0
    let sumCompanyEarnings = 0
    let sumPensionFund = 0

    for (const rideFor of filteredRides) {
      const fare = rideFor.fare ?? ({} as RideFareInterface)
      const breakdown = fare.breakdown ?? ({} as BreakdownType)
      const payouts = fare.payouts ?? ({} as PayoutsBreakdownType)

      // totals
      const totalFor = Number(fare.total ?? 0)
      totalRevenue += totalFor

      totalDistance += Number(rideFor.distance ?? 0)

      sumBaseFare += Number(breakdown.base_fare ?? 0)
      sumDistanceCost += Number(breakdown.distance_cost ?? 0)
      sumWaitCost += Number(breakdown.wait_cost ?? 0)
      sumInsurance += Number(breakdown.insurance_fee ?? 0)
      sumDiscount += Number(breakdown.discount ?? 0)

      sumDriverEarnings += Number(payouts.driver_earnings ?? 0)
      sumCompanyEarnings += Number(payouts.company_earnings ?? 0)
      sumPensionFund += Number(payouts.pension_fund ?? 0)

      if (rideFor.status === 'completed') completed++
      if (rideFor.status === 'canceled') canceled++
    }

    const avgTicket = totalRides === 0 ? 0 : totalRevenue / totalRides
    const avgDistance = totalRides === 0 ? 0 : totalDistance / totalRides

    return {
      totalRides,
      completed,
      canceled,
      totalRevenue,
      avgTicket,
      avgDistance,
      breakdownTotals: {
        base: sumBaseFare,
        distance: sumDistanceCost,
        wait: sumWaitCost,
        insurance: sumInsurance,
        discount: sumDiscount
      },
      payoutsTotals: {
        driver: sumDriverEarnings,
        company: sumCompanyEarnings,
        pension: sumPensionFund
      }
    }
  }, [filteredRides])

  /* -----------------------------
       Charts: rides by month & revenue by month
       ----------------------------- */
  const { ridesByMonthData, revenueByMonthData } = useMemo(() => {
    // Determine months range (use start/end from filters)
    const keys = rangeMonths(start, end)
    const countsMap: Record<string, number> = {}
    const revenueMap: Record<string, number> = {}
    for (const k of keys) {
      countsMap[k] = 0
      revenueMap[k] = 0
    }

    for (const rideInFor of filteredRides) {
      const date = toDate(rideInFor.created_at)
      const key = monthKey(date)
      if (!(key in countsMap)) {
        // if ride is outside month keys (possible if start/end odd), add dynamically
        countsMap[key] = 0
        revenueMap[key] = 0
      }
      countsMap[key] += 1
      revenueMap[key] += Number(rideInFor.fare?.total ?? 0)
    }

    // Ordered keys
    const orderedKeys = Object.keys(countsMap).sort()
    const labels = orderedKeys.map(key => monthLabel(key))
    const counts = orderedKeys.map(key => countsMap[key] ?? 0)
    const revenues = orderedKeys.map(key => revenueMap[key] ?? 0)

    const ridesByMonthData = {
      labels,
      datasets: [
        {
          label: 'Corridas',
          data: counts,
          tension: 0.3,
          fill: false,
          backgroundColor: 'rgba(235, 37, 37, 0.6)',
          borderWidth: 2
        }
      ]
    }

    const revenueByMonthData = {
      labels,
      datasets: [
        {
          label: 'Receita (Kz)',
          data: revenues,
          backgroundColor: 'rgba(37,99,235,0.6)',
          borderWidth: 1
        }
      ]
    }

    return { ridesByMonthData, revenueByMonthData, monthLabels: labels }
  }, [filteredRides, start, end])

  /* -----------------------------
       Distribution by type & status
       ----------------------------- */
  const ridesByType = useMemo(() => {
    const map = new Map<string, number>()
    for (const rideInFor of filteredRides)
      map.set(
        getRideTypeLabel(rideInFor.type),
        (map.get(rideInFor.type) ?? 0) + 1
      )
    const labels = Array.from(map.keys())
    const data = labels.map(k => map.get(k) ?? 0)
    return { labels, data }
  }, [filteredRides])

  const ridesByStatus = useMemo(() => {
    const map = new Map<string, number>()
    for (const rideInFor of filteredRides)
      map.set(
        getRideStatusLabel(rideInFor.status),
        (map.get(rideInFor.status) ?? 0) + 1
      )
    const labels = Array.from(map.keys())
    const data = labels.map(k => map.get(k) ?? 0)
    return { labels, data }
  }, [filteredRides])

  /* -----------------------------
       Top drivers by rides & revenue
       ----------------------------- */
  const topDrivers = useMemo(() => {
    const map: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {}
    for (const ride of filteredRides) {
      if (ride.status !== 'completed') continue

      const id = ride.driver?.id ?? 'unknown'
      const name = ride.driver?.name ?? '—'
      if (!map[id]) map[id] = { name, count: 0, revenue: 0 }
      map[id].count += 1
      map[id].revenue += Number(ride.fare?.total ?? 0)
    }
    const arr = Object.entries(map)
      .map(([id, val]) => ({
        id,
        name: val.name,
        count: val.count,
        revenue: val.revenue
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    return arr
  }, [filteredRides])

  /* -----------------------------
         Map markers (pickups limited)
         ----------------------------- */
  const pickupPoints = useMemo(() => {
    return filteredRides
      .map(r => ({
        lat: r.pickup.latitude,
        lng: r.pickup.longitude,
        info: `${r.user.name} • ${r.id}`
      }))
      .slice(0, 200) // limit markers
  }, [filteredRides])

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <Breadcrumbs items={itemsBreadcrumbs} />

      {/* Header Invisible Clean */}
      <div className="flex flex-col gap-1 mb-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Relatórios de Corridas
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Análise profunda de performance e financeiro
        </p>
      </div>

      {/* Filtros Clean - Card Flutuante */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
        <SelectSearchableCustom
          name="status"
          label="Status"
          options={rideStatusOptions}
          onOptionChange={e => setStatusFilter(e as string)}
        />
        <SelectSearchableCustom
          name="type"
          label="Tipo"
          options={rideTypeOptions}
          onOptionChange={e => setTypeFilter(e as string)}
        />
        <DatePickerCustom
          htmlFor="date-start"
          label="De:"
          selectedValue={selectedDateStart}
          onChange={e => setSelectedDateStart(e as string)}
        />
        <DatePickerCustom
          htmlFor="date-end"
          label="Até:"
          selectedValue={selectedDateEnd}
          onChange={e => setSelectedDateEnd(e as string)}
        />
      </div>

      {/* Principais Métricas - Soft Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Corridas" value={metrics.totalRides} />
        <StatCard
          label="Receita Total"
          value={formatKwanza(metrics.totalRevenue)}
          highlight
        />
        <StatCard
          label="Ticket Médio"
          value={formatKwanza(metrics.avgTicket)}
        />
        <StatCard
          label="Distância Média"
          value={`${metrics.avgDistance.toFixed(2)} km`}
        />
      </div>

      {/* Breakdown & payouts Clean */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarifas */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20">
              <CurrencyDollar className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Tarifas (Totais)
            </h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex justify-between items-center">
              <span>Base</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(metrics.breakdownTotals.base)}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span>Distância</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(metrics.breakdownTotals.distance)}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span>Espera</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(metrics.breakdownTotals.wait)}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span>Seguro</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(metrics.breakdownTotals.insurance)}
              </span>
            </li>
            <li className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-red-500 font-medium">Descontos</span>
              <span className="font-bold text-red-500">
                - {formatMoney(metrics.breakdownTotals.discount)}
              </span>
            </li>
          </ul>
        </div>

        {/* Repasses */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
              <FaUserGroup className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Repasses
            </h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex justify-between items-center">
              <span>Motoristas</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(metrics.payoutsTotals.driver)}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span>Empresa</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(metrics.payoutsTotals.company)}
              </span>
            </li>
            <li className="flex justify-between items-center">
              <span>Fundo Pensão</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(metrics.payoutsTotals.pension)}
              </span>
            </li>
          </ul>
        </div>

        {/* Status */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Status Geral
            </h3>
          </div>
          <ul className="space-y-4">
            <li className="flex items-center justify-between p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                  Concluídas
                </span>
              </div>
              <span className="text-lg font-bold text-green-900 dark:text-green-100">
                {metrics.completed}
              </span>
            </li>
            <li className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
              <div className="flex items-center gap-2">
                <XCircleIcon className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">
                  Canceladas
                </span>
              </div>
              <span className="text-lg font-bold text-red-900 dark:text-red-100">
                {metrics.canceled}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Charts part 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* rides By Month Data */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
            Corridas por Mês
          </h4>
          <Line
            data={ridesByMonthData}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { grid: { display: false } } }
            }}
          />
        </div>

        {/* revenue By Month Data */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
            Receita por Mês
          </h4>
          <Bar
            data={revenueByMonthData}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { grid: { display: false } } }
            }}
          />
        </div>
      </div>

      {/* Charts part 2 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* rides By Status */}
        <div className="col-span-1 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
            Distribuição por Status
          </h4>
          <Pie
            data={{
              labels: ridesByStatus.labels,
              datasets: [
                {
                  data: ridesByStatus.data,
                  backgroundColor: [
                    '#10B981',
                    '#F97316',
                    '#EF4444',
                    '#3B82F6',
                    '#8B5CF6'
                  ],
                  borderWidth: 0
                }
              ]
            }}
          />
        </div>

        {/* rides By Type */}
        <div className="col-span-2 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
            Distribuição por Tipo
          </h4>
          <Bar
            data={{
              labels: ridesByType.labels,
              datasets: [
                {
                  data: ridesByType.data,
                  backgroundColor: [
                    '#00ccff',
                    '#8A2BE2',
                    '#beeaa9',
                    '#724e30',
                    '#F97316'
                  ],
                  borderRadius: 8
                }
              ]
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { grid: { display: false } } }
            }}
          />
        </div>
      </div>

      {/* Top Drivers & Map */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Drivers */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm col-span-1 md:col-span-1">
          <h4 className="font-bold flex items-center gap-2 mb-6 text-gray-900 dark:text-gray-100">
            <Crown size={18} className="text-yellow-500" /> Top Motoristas
          </h4>
          {topDrivers.length === 0 ? (
            <div className="text-sm text-gray-500">Sem dados</div>
          ) : (
            <div className="flex flex-col gap-2">
              {topDrivers.map((driver, index) => (
                <div
                  key={driver.id}
                  className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {index + 1}
                    </span>
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {driver.name}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    {formatKwanza(driver.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm col-span-1 md:col-span-2">
          <h4 className="font-bold mb-6 text-gray-900 dark:text-gray-100">
            Mapa de Pickups Recentes
          </h4>
          {pickupPoints.length === 0 ? (
            <div className="text-sm text-gray-500">Sem localizações</div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <MapContainer
                center={[pickupPoints[0].lat, pickupPoints[0].lng]}
                zoom={12}
                style={{ height: 280 }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {pickupPoints.map((p, i) => (
                  <Marker
                    key={i}
                    position={[p.lat, p.lng]}
                    icon={customPickupIcon}
                  >
                    <Popup>{p.info}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* -----------------------------
   Subcomponentes Soft
   ----------------------------- */
function StatCard({
  label,
  value,
  highlight
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white dark:bg-gray-800 border shadow-sm transition-all hover:shadow-md ${highlight ? 'border-blue-100 dark:border-blue-900/30 ring-1 ring-blue-50 dark:ring-blue-900/20' : 'border-gray-100 dark:border-gray-700'}`}
    >
      <div
        className={`text-xs font-semibold uppercase tracking-wide mb-2 ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
      >
        {label}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        {value}
      </div>
    </div>
  )
}
