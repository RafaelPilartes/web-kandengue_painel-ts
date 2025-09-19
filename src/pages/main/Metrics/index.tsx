// pages/reports/RidesReports.tsx
import { useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { routsNameMain } from '@/constants/routsName'
import { useRidesViewModel } from '@/viewModels/RideViewModel'
import { formatMoney } from '@/utils/number'
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
  PayoutsType,
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

  const namePageRides = 'Corridas'
  const namePageReports = 'Relatórios'
  const namePageReportsDetails = 'Relatórios de Corridas'

  const itemsBreadcrumbs = [
    { label: 'Início', to: routsNameMain.home },
    { label: namePageRides, to: routsNameMain.rides.index },
    { label: namePageReports, to: routsNameMain.metrics.index },
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
      const payouts = fare.payouts ?? ({} as PayoutsType)

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
          borderWidth: 2
        }
      ]
    }

    const revenueByMonthData = {
      labels,
      datasets: [
        {
          label: 'Receita (AOA)',
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

      {/* Filtros */}
      <div className="p-4 bg-light dark:bg-dark rounded-md shadow grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Principais Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Corridas" value={metrics.totalRides} />
        <StatCard
          label="Receita Total"
          value={`AOA ${formatMoney(metrics.totalRevenue)}`}
        />
        <StatCard
          label="Ticket Médio"
          value={`AOA ${formatMoney(metrics.avgTicket)}`}
        />
        <StatCard
          label="Distância Média (km)"
          value={`${metrics.avgDistance.toFixed(2)} km`}
        />
        {/* <StatCard label="Receita Total" value={`AOA ${formatMoney(totalRevenue)}`} />
              <StatCard label="Receita Média" value={`AOA ${formatMoney(totalRevenue / (filteredRides.length || 1))}`} /> */}
      </div>

      {/* Breakdown & payouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarifas */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
            <CurrencyDollar className="h-5 w-5 text-green-500 mr-2" />
            Tarifas (Totais)
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Base:</span>
              <span className="ml-2">
                {formatMoney(metrics.breakdownTotals.base)}
              </span>
            </li>
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Distância:</span>
              <span className="ml-2">
                {formatMoney(metrics.breakdownTotals.distance)}
              </span>
            </li>
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Espera:</span>
              <span className="ml-2">
                {formatMoney(metrics.breakdownTotals.wait)}
              </span>
            </li>
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Seguro:</span>
              <span className="ml-2">
                {formatMoney(metrics.breakdownTotals.insurance)}
              </span>
            </li>
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Descontos:</span>
              <span className="ml-2 text-red-500">
                - {formatMoney(metrics.breakdownTotals.discount)}
              </span>
            </li>
          </ul>
        </div>

        {/* Repasses */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
            <FaUserGroup className="h-5 w-5 text-indigo-500 mr-2" />
            Repasses
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Motoristas:</span>
              <span className="ml-2">
                {formatMoney(metrics.payoutsTotals.driver)}
              </span>
            </li>
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Empresa:</span>
              <span className="ml-2">
                {formatMoney(metrics.payoutsTotals.company)}
              </span>
            </li>
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <span className="w-1/2">Fundo Pensão:</span>
              <span className="ml-2">
                {formatMoney(metrics.payoutsTotals.pension)}
              </span>
            </li>
          </ul>
        </div>

        {/* Status */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
            <ShieldCheckIcon className="h-5 w-5 text-blue-500 mr-2" />
            Status
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="w-1/2">Concluídas:</span>
              <span className="ml-2">{metrics.completed}</span>
            </li>
            <li className="flex items-center pb-1 pt-1 border-b border-gray-400 dark:border-gray-700">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="w-1/2">Canceladas:</span>
              <span className="ml-2">{metrics.canceled}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Charts part 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* rides By Month Data */}
        <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow">
          <h4 className="font-semibold mb-2">Corridas por Mês</h4>
          <Line data={ridesByMonthData} />
        </div>

        {/* revenue By Month Data */}
        <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow">
          <h4 className="font-semibold mb-2">Receita por Mês</h4>
          <Bar data={revenueByMonthData} />
        </div>
      </div>

      {/* Charts part 2 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* rides By Status */}
        <div className="col-span-1 p-4 rounded-md bg-white dark:bg-gray-800 shadow">
          <h4 className="font-semibold mb-2">Distribuição por Status</h4>
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
                  ]
                }
              ]
            }}
          />
        </div>

        {/* rides By Type */}
        <div className="col-span-2 p-4 rounded-md bg-white dark:bg-gray-800 shadow">
          <h4 className="font-semibold mb-2">Distribuição por Tipo</h4>
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
                  ]
                }
              ]
            }}
          />
        </div>
      </div>

      {/* Top Drivers & Map */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Drivers */}
        <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow col-span-1 md:col-span-1">
          <h4 className="font-semibold flex items-center gap-2 mb-3">
            <Crown className="text-yellow-500" /> Top Motoristas
          </h4>
          {topDrivers.length === 0 ? (
            <div className="text-sm text-gray-500">Sem dados</div>
          ) : (
            <ul className="space-y-2">
              {topDrivers.map((driver, index) => (
                <li
                  key={driver.id}
                  className="flex justify-between items-center p-3 rounded-md bg-light dark:bg-dark/50 shadow border-b-2 border-b-yellow-500"
                >
                  <div>
                    <div className="font-medium">
                      {index + 1}. {driver.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {driver.count} corridas
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    AOA {formatMoney(driver.revenue)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow col-span-1 md:col-span-2">
          <h4 className="font-semibold mb-3">
            Mapa - Pickups (primeiros {pickupPoints.length})
          </h4>
          {pickupPoints.length === 0 ? (
            <div className="text-sm text-gray-500">Sem localizações</div>
          ) : (
            <MapContainer
              center={[pickupPoints[0].lat, pickupPoints[0].lng]}
              zoom={12}
              style={{ height: 260 }}
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
          )}
        </div>
      </div>
    </div>
  )
}

/* -----------------------------
   Subcomponentes
   ----------------------------- */
function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-md bg-white dark:bg-gray-800 shadow border-t-4 border-blue-600">
      <div className="text-sm text-gray-500 dark:text-gray-300">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  )
}
